// Renders each page of a PDF as a picture 2400 px wide, for bin/menus:
//   swift scripts/pdf-pages.swift <pdf> <folder>
// writes <folder>/1.png, 2.png… and prints how many pages there were. PDFKit comes with macOS,
// where bin/menus runs; the tests replace this with a fake.
import AppKit
import PDFKit

let arguments = CommandLine.arguments
guard arguments.count == 3, let pdf = PDFDocument(url: URL(fileURLWithPath: arguments[1])) else {
  FileHandle.standardError.write("Usage: swift scripts/pdf-pages.swift <pdf> <folder>\n".data(using: .utf8)!)
  exit(1)
}
for index in 0..<pdf.pageCount {
  let page = pdf.page(at: index)!
  let box = page.bounds(for: .mediaBox)
  let image = page.thumbnail(of: NSSize(width: 2400, height: (2400 * box.height / box.width).rounded()), for: .mediaBox)
  guard let tiff = image.tiffRepresentation, let png = NSBitmapImageRep(data: tiff)?.representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write("Could not render page \(index + 1) of \(arguments[1])\n".data(using: .utf8)!)
    exit(1)
  }
  try png.write(to: URL(fileURLWithPath: arguments[2]).appendingPathComponent("\(index + 1).png"))
}
print(pdf.pageCount)
