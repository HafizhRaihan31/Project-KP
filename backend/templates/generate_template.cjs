const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require("docx");

const COLUMN_WIDTHS = [500, 900, 1100, 1700, 1700, 1200, 800, 800, 1100];
const TABLE_WIDTH = COLUMN_WIDTHS.reduce((a, b) => a + b, 0);

function headerCell(text) {
  return new TableCell({
    width: { size: 0, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
  });
}

function dataCell(text) {
  return new TableCell({
    width: { size: 0, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text })] })],
  });
}

const headerRow = new TableRow({
  children: [
    headerCell("NO"),
    headerCell("WOK"),
    headerCell("Tipe Desain"),
    headerCell("Nama Proyek"),
    headerCell("Keterangan Drop"),
    headerCell("IHLD Lop ID"),
    headerCell("Jml ODP"),
    headerCell("Jml Port"),
    headerCell("Total BOQ"),
  ],
});

// Baris ini adalah "baris loop": {#items} di sel pertama, {/items} di sel
// terakhir. Saat docxtemplater merender, seluruh baris ini akan digandakan
// sebanyak jumlah data di array `items`.
const loopRow = new TableRow({
  children: [
    dataCell("{#items}{no}"),
    dataCell("{wok}"),
    dataCell("{tipeDesain}"),
    dataCell("{namaProyek}"),
    dataCell("{keteranganDrop}"),
    dataCell("{ihldLopId}"),
    dataCell("{jmlOdp}"),
    dataCell("{jmlPort}"),
    dataCell("{totalBoq}{/items}"),
  ],
});

const totalRow = new TableRow({
  children: [
    dataCell(""),
    dataCell(""),
    dataCell(""),
    dataCell(""),
    dataCell(""),
    headerCell("TOTAL"),
    dataCell("{totalOdp}"),
    dataCell("{totalPort}"),
    dataCell("{totalBoq}"),
  ],
});

const table = new Table({
  width: { size: TABLE_WIDTH, type: WidthType.DXA },
  columnWidths: COLUMN_WIDTHS,
  rows: [headerRow, loopRow, totalRow],
});

const doc = new Document({
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 } }, // US Letter
      },
      children: [
        new Paragraph({
          text: "BERITA ACARA DROP LOP PEKERJAAN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun(
              "Pada hari ini, tanggal "
            ),
            new TextRun({ text: "{tanggalDibuat}", bold: true }),
            new TextRun(
              ", disepakati bahwa untuk proyek-proyek berikut tidak dapat dilanjutkan pekerjaannya:"
            ),
          ],
        }),
        new Paragraph({ text: "" }),
        table,
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun("Demikian, untuk "),
            new TextRun({ text: "{jumlahLop}", bold: true }),
            new TextRun(
              " LOP tersebut tidak dapat dilanjutkan pekerjaannya berdasarkan kendala keterangan di atas."
            ),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(__dirname + "/ba-drop-template.docx", buffer);
  console.log("Template berhasil dibuat: ba-drop-template.docx");
});
