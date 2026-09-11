
import base64
import io

from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from pypdf import PdfReader, PdfWriter


def decode_signature_image(image_data: str) -> bytes:
    header, encoded = image_data.split(',', 1)
    return base64.b64decode(encoded)


def create_signature_overlay(
    image_bytes: bytes,
    x: int,
    y: int,
    page_width: float,
    page_height: float
) -> io.BytesIO:

    image_buffer = io.BytesIO(image_bytes)
    overlay_buffer = io.BytesIO()

    c = canvas.Canvas(
        overlay_buffer,
        pagesize=(page_width, page_height)
    )

    # TEST MARKER
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y + 90, "SIGNATURE TEST")

    # Signature image
    c.drawImage(
        ImageReader(image_buffer),
        x,
        y,
        width=150,
        height=75,
        mask="auto"
    )

    c.save()

    overlay_buffer.seek(0)

    return overlay_buffer


def stamp_signature(
    original_pdf_path: str,
    image_data: str,
    page_number: int,
    x: int,
    y: int,
    output_path: str
):

    print("====================================")
    print("STAMP SIGNATURE STARTED")
    print("PAGE:", page_number)
    print("X:", x)
    print("Y:", y)
    print("IMAGE DATA LENGTH:", len(image_data))
    print("====================================")

    image_bytes = decode_signature_image(image_data)

    print("IMAGE BYTES:", len(image_bytes))

    reader = PdfReader(original_pdf_path)
    writer = PdfWriter()

    target_page = reader.pages[page_number - 1]

    page_width = float(target_page.mediabox.width)
    page_height = float(target_page.mediabox.height)

    print("PAGE WIDTH:", page_width)
    print("PAGE HEIGHT:", page_height)

    overlay_buffer = create_signature_overlay(
        image_bytes,
        x,
        y,
        page_width,
        page_height
    )

    overlay_reader = PdfReader(overlay_buffer)
    overlay_page = overlay_reader.pages[0]

    target_page.merge_page(overlay_page)

    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    print("====================================")
    print("SIGNED PDF CREATED SUCCESSFULLY")
    print("OUTPUT:", output_path)
    print("====================================")

