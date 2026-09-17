"""Membuat template BA Drop. Jalankan dari root backend dengan Python 3."""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

OUTPUT = Path(__file__).with_name("ba-drop-template.docx")


def set_cell_border(cell, **edges):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = tc_pr.first_child_found_in("w:tcBorders")
    if tc_borders is None:
        tc_borders = OxmlElement("w:tcBorders")
        tc_pr.append(tc_borders)
    for edge, settings in edges.items():
        tag = f"w:{edge}"
        element = tc_borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            tc_borders.append(element)
        for key, value in settings.items():
            element.set(qn(f"w:{key}"), str(value))


def set_paragraph_bottom_border(paragraph, size=10):
    p_pr = paragraph._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "5")
    bottom.set(qn("w:color"), "000000")
    borders.append(bottom)
    p_pr.append(borders)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), fill)
    tc_pr.append(shading)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def set_cell_text(cell, text, *, bold=False, size=8, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    paragraph = cell.paragraphs[0]
    paragraph.alignment = align
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.space_before = Pt(0)
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.name = "Arial"
    run.font.size = Pt(size)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Arial")


def remove_table_borders(table):
    for row in table.rows:
        for cell in row.cells:
            none = {"val": "nil"}
            set_cell_border(cell, top=none, left=none, bottom=none, right=none, insideH=none, insideV=none)


doc = Document()
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(1.1)
section.bottom_margin = Cm(1.2)
section.left_margin = Cm(1.1)
section.right_margin = Cm(1.1)

normal = doc.styles["Normal"]
normal.font.name = "Arial"
normal.font.size = Pt(9)
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")

# Area logo sengaja berupa teks agar mudah diganti dengan gambar di Word.
logo_table = doc.add_table(rows=1, cols=2)
logo_table.alignment = WD_TABLE_ALIGNMENT.CENTER
logo_table.columns[0].width = Inches(3.6)
logo_table.columns[1].width = Inches(3.6)
remove_table_borders(logo_table)
for index, (text, align) in enumerate([
    ("[GANTI DENGAN LOGO KIRI]", WD_ALIGN_PARAGRAPH.LEFT),
    ("[GANTI DENGAN LOGO KANAN]", WD_ALIGN_PARAGRAPH.RIGHT),
]):
    cell = logo_table.cell(0, index)
    cell.height = Cm(1.8)
    set_cell_text(cell, text, bold=True, size=8, align=align)
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(128, 128, 128)

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.paragraph_format.space_before = Pt(3)
title.paragraph_format.space_after = Pt(8)
title_run = title.add_run("BERITA ACARA DROP LOP PEKERJAAN")
title_run.bold = True
title_run.font.name = "Arial"
title_run.font.size = Pt(14)
set_paragraph_bottom_border(title)

info = doc.add_table(rows=4, cols=3)
info.alignment = WD_TABLE_ALIGNMENT.CENTER
info.autofit = False
widths = [Cm(2.8), Cm(0.45), Cm(15.0)]
labels = [
    ("Proyek", "{judulProyek}"),
    ("No. Kontrak", "{nomorKontrak}"),
    ("No. SP", "{nomorSp}"),
    ("Pelaksana", "{pelaksana}"),
]
for row, (label, value) in zip(info.rows, labels):
    for cell, width in zip(row.cells, widths):
        cell.width = width
    set_cell_text(row.cells[0], label, bold=True, size=9)
    set_cell_text(row.cells[1], ":", bold=True, size=9, align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_text(row.cells[2], value, bold=True, size=9)
remove_table_borders(info)

rule = doc.add_paragraph()
rule.paragraph_format.space_before = Pt(4)
rule.paragraph_format.space_after = Pt(9)
set_paragraph_bottom_border(rule)

opening = doc.add_paragraph()
opening.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
opening.paragraph_format.first_line_indent = Cm(1.5)
opening.paragraph_format.line_spacing = 1.15
opening.paragraph_format.space_after = Pt(8)
opening.add_run("Pada hari ini ")
opening.add_run("{tanggalBeritaAcara}").bold = True
opening.add_run(", Telkomsel, TIF dan Telkom Akses sepakat bahwa Project ")
opening.add_run("{judulProyek}").bold = True
opening.add_run(", District ")
opening.add_run("{district}").bold = True
opening.add_run(" dengan lokasi sebagai berikut:")

headers = ["NO", "WOK", "Tipe\nDesain", "Nama Proyek", "Keterangan Drop", "IHLD Lop\nID", "Jml\nODP", "Jml\nPort", "Total BOQ"]
widths = [Cm(0.95), Cm(1.2), Cm(1.45), Cm(3.2), Cm(3.45), Cm(2.0), Cm(1.05), Cm(1.05), Cm(2.35)]
table = doc.add_table(rows=3, cols=9)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.autofit = False
table.style = "Table Grid"

for cell, text, width in zip(table.rows[0].cells, headers, widths):
    cell.width = width
    set_cell_text(cell, text, bold=True, size=7.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_shading(cell, "F2F2F2")
set_repeat_table_header(table.rows[0])

loop_values = ["{#items}{no}", "{wok}", "{tipeDesain}", "{namaProyek}", "{keteranganDrop}", "{ihldLopId}", "{jmlOdp}", "{jmlPort}", "{totalBoq}{/items}"]
for index, (cell, text, width) in enumerate(zip(table.rows[1].cells, loop_values, widths)):
    cell.width = width
    set_cell_text(cell, text, size=7.5, align=WD_ALIGN_PARAGRAPH.CENTER if index != 4 else WD_ALIGN_PARAGRAPH.LEFT)

total_values = ["", "", "", "", "", "TOTAL", "{totalOdp}", "{totalPort}", "{totalBoq}"]
for cell, text, width in zip(table.rows[2].cells, total_values, widths):
    cell.width = width
    set_cell_text(cell, text, bold=True, size=7.5, align=WD_ALIGN_PARAGRAPH.CENTER)

closing = doc.add_paragraph()
closing.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
closing.paragraph_format.space_before = Pt(9)
closing.paragraph_format.line_spacing = 1.15
closing.add_run("Demikian, untuk ")
closing.add_run("{jumlahLop}").bold = True
closing.add_run(" LOP tersebut tidak dapat dilanjutkan pekerjaannya berdasarkan kendala keterangan di atas.")

doc.save(OUTPUT)
print(f"Template dibuat: {OUTPUT}")
