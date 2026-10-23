import UIKit
import Vision

/// Apple Vision OCR. Returns one entry per recognised line with a normalised,
/// top-left-origin bounding box so JavaScript can rebuild paragraphs.
enum TextRecognizer {
  static func recognize(uri: String, languages: [String]) throws -> [[String: Any]] {
    guard
      let image = UIImage(contentsOfFile: PageProcessor.filePath(from: uri)),
      let cgImage = PageProcessor.normalizedCGImage(image, maxDimension: 4000)
    else {
      throw ImageLoadException(uri)
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    if let supported = try? request.supportedRecognitionLanguages() {
      let wanted = languages.filter { supported.contains($0) }
      if !wanted.isEmpty {
        request.recognitionLanguages = wanted
      }
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []
    return observations.compactMap { observation -> [String: Any]? in
      guard let candidate = observation.topCandidates(1).first else { return nil }
      let box = observation.boundingBox
      return [
        "text": candidate.string,
        "confidence": Double(candidate.confidence),
        "x": Double(box.minX),
        "y": Double(1 - box.maxY),
        "width": Double(box.width),
        "height": Double(box.height),
      ]
    }
  }
}
