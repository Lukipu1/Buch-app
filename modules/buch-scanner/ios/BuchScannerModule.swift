import ExpoModulesCore
import UIKit
import VisionKit

/// Options shared by `scanDocument` and `processImage`.
struct ProcessOptions: Record {
  /// "auto" splits landscape double-page spreads, "always" splits every
  /// image, "never" keeps images as they are.
  @Field var splitMode: String = "auto"
  /// Detect the page outline and correct perspective (gallery imports only;
  /// the VisionKit camera already crops).
  @Field var autoCrop: Bool = false
  /// JPEG quality 0–1 of the written page images.
  @Field var quality: Double = 0.85
}

/**
 Native bridge for Buch:
 - `scanDocument` presents Apple's VisionKit document camera (edge detection,
   perspective correction, multi-page capture) and returns one image per
   physical book page – double-page spreads are split at the gutter.
 - `processImage` runs the same crop/split pipeline on an existing image.
 - `recognizeText` runs Apple Vision OCR and returns positioned text lines.
 */
public class BuchScannerModule: Module {
  private var activeSession: DocumentScanSession?

  public func definition() -> ModuleDefinition {
    Name("BuchScanner")

    Function("isDocumentScannerAvailable") { () -> Bool in
      return VNDocumentCameraViewController.isSupported
    }

    AsyncFunction("scanDocument") { (options: ProcessOptions, promise: Promise) in
      guard VNDocumentCameraViewController.isSupported else {
        promise.reject("ERR_SCANNER_UNSUPPORTED", "Der Dokumentenscanner wird auf diesem Gerät nicht unterstützt.")
        return
      }
      guard self.activeSession == nil else {
        promise.reject("ERR_SCANNER_BUSY", "Es läuft bereits ein Scan.")
        return
      }
      guard let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("ERR_SCANNER_NO_VIEW", "Der Scanner konnte nicht geöffnet werden.")
        return
      }

      let session = DocumentScanSession(options: options) { [weak self] result in
        self?.activeSession = nil
        switch result {
        case .success(let pages):
          promise.resolve(pages.map { $0.toDictionary() })
        case .failure(let error):
          promise.reject("ERR_SCANNER_FAILED", error.localizedDescription)
        }
      }
      self.activeSession = session
      session.present(from: presenter)
    }.runOnQueue(.main)

    AsyncFunction("processImage") { (uri: String, options: ProcessOptions) throws -> [[String: Any]] in
      let pages = try PageProcessor.process(uri: uri, options: options)
      return pages.map { $0.toDictionary() }
    }

    AsyncFunction("recognizeText") { (uri: String, languages: [String]) throws -> [[String: Any]] in
      return try TextRecognizer.recognize(uri: uri, languages: languages)
    }
  }
}

/// Owns the presented VisionKit controller for the duration of one scan.
final class DocumentScanSession: NSObject, VNDocumentCameraViewControllerDelegate {
  private let options: ProcessOptions
  private let completion: (Result<[ProcessedPage], Error>) -> Void
  private var finished = false

  init(options: ProcessOptions, completion: @escaping (Result<[ProcessedPage], Error>) -> Void) {
    self.options = options
    self.completion = completion
  }

  func present(from presenter: UIViewController) {
    let controller = VNDocumentCameraViewController()
    controller.delegate = self
    controller.modalPresentationStyle = .fullScreen
    presenter.present(controller, animated: true)
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFinishWith scan: VNDocumentCameraScan
  ) {
    controller.dismiss(animated: true)
    let options = self.options
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        var pages: [ProcessedPage] = []
        for index in 0..<scan.pageCount {
          try autoreleasepool {
            let image = scan.imageOfPage(at: index)
            // VisionKit already crops and corrects perspective.
            pages.append(contentsOf: try PageProcessor.process(image: image, options: options, autoCrop: false))
          }
        }
        let result = pages
        DispatchQueue.main.async { self.finish(.success(result)) }
      } catch {
        DispatchQueue.main.async { self.finish(.failure(error)) }
      }
    }
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
    finish(.success([]))
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFailWithError error: Error
  ) {
    controller.dismiss(animated: true)
    finish(.failure(error))
  }

  private func finish(_ result: Result<[ProcessedPage], Error>) {
    guard !finished else { return }
    finished = true
    completion(result)
  }
}

internal final class ImageLoadException: GenericException<String> {
  override var reason: String {
    "Das Bild '\(param)' konnte nicht geladen werden."
  }
}

internal final class ImageProcessingException: Exception {
  override var reason: String {
    "Das Bild konnte nicht verarbeitet werden."
  }
}
