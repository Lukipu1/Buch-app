import CoreImage
import UIKit
import Vision

struct ProcessedPage {
  let uri: String
  let width: Int
  let height: Int
  /// "single", or "left" / "right" when the page came from a split spread.
  let side: String

  func toDictionary() -> [String: Any] {
    return ["uri": uri, "width": width, "height": height, "side": side]
  }
}

/// Crop → split → write pipeline for scanned book pages.
enum PageProcessor {
  /// Longest edge of stored page images. Plenty for reading and OCR while
  /// keeping files small.
  static let maxDimension: CGFloat = 3000
  /// Width/height ratio above which an image is treated as a double page.
  static let spreadRatio: Double = 1.12

  private static let ciContext = CIContext(options: nil)

  static func process(uri: String, options: ProcessOptions) throws -> [ProcessedPage] {
    guard let image = UIImage(contentsOfFile: filePath(from: uri)) else {
      throw ImageLoadException(uri)
    }
    return try process(image: image, options: options, autoCrop: options.autoCrop)
  }

  static func process(image: UIImage, options: ProcessOptions, autoCrop: Bool) throws -> [ProcessedPage] {
    guard var cgImage = normalizedCGImage(image, maxDimension: maxDimension) else {
      throw ImageProcessingException()
    }
    if autoCrop, let cropped = cropToDocument(cgImage) {
      cgImage = cropped
    }
    return try split(cgImage, mode: options.splitMode).map { part in
      try write(part.image, side: part.side, quality: options.quality)
    }
  }

  static func filePath(from uri: String) -> String {
    if uri.hasPrefix("file://"), let url = URL(string: uri) {
      return url.path
    }
    return uri
  }

  /// Applies the EXIF orientation and downsizes very large images.
  static func normalizedCGImage(_ image: UIImage, maxDimension: CGFloat) -> CGImage? {
    let pixelSize = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
    let longest = max(pixelSize.width, pixelSize.height)
    let factor = longest > maxDimension ? maxDimension / longest : 1

    if image.imageOrientation == .up, factor == 1, let cgImage = image.cgImage {
      return cgImage
    }

    let target = CGSize(width: floor(pixelSize.width * factor), height: floor(pixelSize.height * factor))
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    format.opaque = true
    let renderer = UIGraphicsImageRenderer(size: target, format: format)
    let rendered = renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: target))
    }
    return rendered.cgImage
  }

  /// Finds the page (or spread) outline and corrects its perspective.
  static func cropToDocument(_ cgImage: CGImage) -> CGImage? {
    let request = VNDetectDocumentSegmentationRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
      try handler.perform([request])
    } catch {
      return nil
    }
    guard let observation = request.results?.first, observation.confidence >= 0.6 else {
      return nil
    }

    let corners = [observation.topLeft, observation.topRight, observation.bottomRight, observation.bottomLeft]
    let area = polygonArea(corners)
    // Ignore tiny detections and ones that already cover the whole frame.
    guard area > 0.2, area < 0.97 else { return nil }

    let width = CGFloat(cgImage.width)
    let height = CGFloat(cgImage.height)
    func vector(_ point: CGPoint) -> CIVector {
      // Vision and Core Image both use a bottom-left origin.
      return CIVector(x: point.x * width, y: point.y * height)
    }

    guard let filter = CIFilter(name: "CIPerspectiveCorrection") else { return nil }
    filter.setValue(CIImage(cgImage: cgImage), forKey: kCIInputImageKey)
    filter.setValue(vector(observation.topLeft), forKey: "inputTopLeft")
    filter.setValue(vector(observation.topRight), forKey: "inputTopRight")
    filter.setValue(vector(observation.bottomLeft), forKey: "inputBottomLeft")
    filter.setValue(vector(observation.bottomRight), forKey: "inputBottomRight")

    guard let output = filter.outputImage else { return nil }
    return ciContext.createCGImage(output, from: output.extent)
  }

  /// Splits a double-page spread into its left and right page.
  static func split(_ cgImage: CGImage, mode: String) -> [(image: CGImage, side: String)] {
    let width = cgImage.width
    let height = cgImage.height
    let isSpread = Double(width) / Double(max(1, height)) > spreadRatio
    let shouldSplit = mode == "always" || (mode == "auto" && isSpread)
    guard shouldSplit, width > 40 else { return [(cgImage, "single")] }

    let gutter = GutterDetector.findGutter(cgImage) ?? width / 2
    // Drop a thin strip around the fold so the spine shadow disappears.
    let trim = max(2, width / 160)
    let leftWidth = max(1, gutter - trim)
    let rightX = min(width - 1, gutter + trim)
    let leftRect = CGRect(x: 0, y: 0, width: leftWidth, height: height)
    let rightRect = CGRect(x: rightX, y: 0, width: max(1, width - rightX), height: height)

    guard let left = cgImage.cropping(to: leftRect), let right = cgImage.cropping(to: rightRect) else {
      return [(cgImage, "single")]
    }
    return [(left, "left"), (right, "right")]
  }

  static func write(_ cgImage: CGImage, side: String, quality: Double) throws -> ProcessedPage {
    let image = UIImage(cgImage: cgImage)
    guard let data = image.jpegData(compressionQuality: CGFloat(min(1, max(0.1, quality)))) else {
      throw ImageProcessingException()
    }
    let directory = FileManager.default
      .urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("BuchScanner", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let url = directory.appendingPathComponent("\(UUID().uuidString).jpg")
    try data.write(to: url, options: .atomic)
    return ProcessedPage(uri: url.absoluteString, width: cgImage.width, height: cgImage.height, side: side)
  }

  private static func polygonArea(_ points: [CGPoint]) -> CGFloat {
    var sum: CGFloat = 0
    for index in 0..<points.count {
      let a = points[index]
      let b = points[(index + 1) % points.count]
      sum += a.x * b.y - b.x * a.y
    }
    return abs(sum) / 2
  }
}

/// Locates the fold between two pages of an open book.
enum GutterDetector {
  /**
   Samples a grayscale thumbnail and scores every column in the middle band by
   `mean + standardDeviation` of its brightness. The spine shadow is dark and
   uniform (low score), text columns vary strongly and margins are bright, so
   the lowest score marks the fold. Returns nil when no clear fold exists.
   */
  static func findGutter(_ cgImage: CGImage) -> Int? {
    let sampleWidth = 480
    let scale = Double(sampleWidth) / Double(cgImage.width)
    let sampleHeight = max(1, Int(Double(cgImage.height) * scale))

    guard let context = CGContext(
      data: nil,
      width: sampleWidth,
      height: sampleHeight,
      bitsPerComponent: 8,
      bytesPerRow: 0,
      space: CGColorSpaceCreateDeviceGray(),
      bitmapInfo: CGImageAlphaInfo.none.rawValue
    ) else { return nil }
    context.interpolationQuality = .medium
    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: sampleWidth, height: sampleHeight))
    guard let data = context.data else { return nil }

    let bytesPerRow = context.bytesPerRow
    let pixels = data.bindMemory(to: UInt8.self, capacity: bytesPerRow * sampleHeight)

    let y0 = Int(Double(sampleHeight) * 0.1)
    let y1 = max(y0 + 1, Int(Double(sampleHeight) * 0.9))
    let x0 = Int(Double(sampleWidth) * 0.35)
    let x1 = Int(Double(sampleWidth) * 0.65)
    let center = Double(sampleWidth) / 2
    let halfBand = Double(x1 - x0) / 2

    var scores: [Double] = []
    scores.reserveCapacity(x1 - x0)
    for x in x0..<x1 {
      var sum = 0.0
      var sumSquares = 0.0
      for y in y0..<y1 {
        let value = Double(pixels[y * bytesPerRow + x])
        sum += value
        sumSquares += value * value
      }
      let count = Double(y1 - y0)
      let mean = sum / count
      let deviation = sqrt(max(0, sumSquares / count - mean * mean))
      // Slight preference for the centre so noise at the band edges loses.
      let centerPenalty = abs(Double(x) - center) / halfBand * 6
      scores.append(mean + deviation + centerPenalty)
    }

    let radius = 3
    var smoothed = [Double](repeating: 0, count: scores.count)
    for index in 0..<scores.count {
      let lower = max(0, index - radius)
      let upper = min(scores.count - 1, index + radius)
      var total = 0.0
      for j in lower...upper { total += scores[j] }
      smoothed[index] = total / Double(upper - lower + 1)
    }

    guard let minIndex = smoothed.indices.min(by: { smoothed[$0] < smoothed[$1] }) else { return nil }
    let sorted = smoothed.sorted()
    let median = sorted[sorted.count / 2]
    guard median - smoothed[minIndex] > 8 else { return nil }

    return Int(Double(x0 + minIndex) / scale)
  }
}
