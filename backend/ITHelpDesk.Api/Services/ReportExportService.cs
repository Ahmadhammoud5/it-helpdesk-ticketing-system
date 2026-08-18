using ClosedXML.Excel;
using ITHelpDesk.Api.DTOs.Reports;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;

namespace ITHelpDesk.Api.Services;

public sealed class ReportExportService : IReportExportService
{
    private const string ReportTitle =
        "IT HelpDesk - Reports & Analytics";

    private const string PdfTitleStyle = "ReportTitle";

    public byte[] CreateExcel(
        ReportSummaryResponse report,
        DateTime generatedAtUtc)
    {
        using var workbook = new XLWorkbook();

        workbook.Properties.Title = ReportTitle;
        workbook.Properties.Subject =
            "Help desk ticket analytics export";

        AddSummaryWorksheet(
            workbook,
            report,
            generatedAtUtc);

        AddBreakdownWorksheet(
            workbook,
            "By Status",
            "Status",
            report.TicketsByStatus);

        AddBreakdownWorksheet(
            workbook,
            "By Priority",
            "Priority",
            report.TicketsByPriority);

        AddBreakdownWorksheet(
            workbook,
            "By Category",
            "Category",
            report.TicketsByCategory);

        AddVolumeWorksheet(
            workbook,
            report.TicketVolume);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return stream.ToArray();
    }

    public byte[] CreatePdf(
        ReportSummaryResponse report,
        DateTime generatedAtUtc)
    {
        var document = CreatePdfDocument(
            report,
            generatedAtUtc);

        var renderer = new PdfDocumentRenderer
        {
            Document = document
        };

        renderer.RenderDocument();

        using var pdfDocument = renderer.PdfDocument;
        using var stream = new MemoryStream();
        pdfDocument.Save(stream, false);

        return stream.ToArray();
    }

    private static void AddSummaryWorksheet(
        XLWorkbook workbook,
        ReportSummaryResponse report,
        DateTime generatedAtUtc)
    {
        var worksheet = workbook.Worksheets.Add("Summary");

        worksheet.Range("A1:B1").Merge();
        worksheet.Cell("A1").Value = ReportTitle;
        worksheet.Cell("A1").Style.Font.Bold = true;
        worksheet.Cell("A1").Style.Font.FontSize = 16;
        worksheet.Cell("A1").Style.Font.FontColor = XLColor.White;
        worksheet.Cell("A1").Style.Fill.BackgroundColor =
            XLColor.FromHtml("#1D4ED8");
        worksheet.Cell("A1").Style.Alignment.Horizontal =
            XLAlignmentHorizontalValues.Center;
        worksheet.Row(1).Height = 28;

        SetSummaryMetadataRow(
            worksheet,
            3,
            "From date",
            report.From.ToDateTime(TimeOnly.MinValue));

        SetSummaryMetadataRow(
            worksheet,
            4,
            "To date",
            report.To.ToDateTime(TimeOnly.MinValue));

        SetSummaryMetadataRow(
            worksheet,
            5,
            "Generated UTC",
            generatedAtUtc);

        worksheet.Range("A7:B7").Style.Font.Bold = true;
        worksheet.Range("A7:B7").Style.Font.FontColor = XLColor.White;
        worksheet.Range("A7:B7").Style.Fill.BackgroundColor =
            XLColor.FromHtml("#334155");
        worksheet.Cell("A7").Value = "Metric";
        worksheet.Cell("B7").Value = "Value";

        var metrics = new (string Label, int Value)[]
        {
            ("Total Tickets", report.TotalTickets),
            ("Open", report.OpenTickets),
            ("In Progress", report.InProgressTickets),
            ("Pending", report.PendingTickets),
            ("Resolved", report.ResolvedTickets),
            ("Closed", report.ClosedTickets),
            ("Cancelled", report.CancelledTickets)
        };

        var rowNumber = 8;

        foreach (var metric in metrics)
        {
            worksheet.Cell(rowNumber, 1).Value = metric.Label;
            worksheet.Cell(rowNumber, 2).Value = metric.Value;
            worksheet.Cell(rowNumber, 2).Style.NumberFormat.Format = "0";
            rowNumber++;
        }

        worksheet.Cell(rowNumber, 1).Value =
            "Average Resolution Time";

        if (report.AverageResolutionMinutes.HasValue)
        {
            worksheet.Cell(rowNumber, 2).Value = TimeSpan.FromMinutes(
                report.AverageResolutionMinutes.Value);

            worksheet.Cell(rowNumber, 2).Style.NumberFormat.Format =
                "[h]\" hr \"mm\" min\"";
        }
        else
        {
            worksheet.Cell(rowNumber, 2).Value = "Unavailable";
        }

        var dataRange = worksheet.Range(7, 1, rowNumber, 2);
        dataRange.Style.Border.OutsideBorder =
            XLBorderStyleValues.Thin;
        dataRange.Style.Border.InsideBorder =
            XLBorderStyleValues.Thin;
        dataRange.Style.Border.OutsideBorderColor =
            XLColor.FromHtml("#CBD5E1");
        dataRange.Style.Border.InsideBorderColor =
            XLColor.FromHtml("#E2E8F0");

        worksheet.Column(1).Width = 30;
        worksheet.Column(2).Width = 24;
        worksheet.SheetView.FreezeRows(1);
    }

    private static void SetSummaryMetadataRow(
        IXLWorksheet worksheet,
        int rowNumber,
        string label,
        DateTime value)
    {
        worksheet.Cell(rowNumber, 1).Value = label;
        worksheet.Cell(rowNumber, 1).Style.Font.Bold = true;
        worksheet.Cell(rowNumber, 1).Style.Fill.BackgroundColor =
            XLColor.FromHtml("#EFF6FF");
        worksheet.Cell(rowNumber, 2).Value = value;

        worksheet.Cell(rowNumber, 2).Style.NumberFormat.Format =
            label == "Generated UTC"
                ? "yyyy-mm-dd hh:mm:ss \"UTC\""
                : "yyyy-mm-dd";
    }

    private static void AddBreakdownWorksheet(
        XLWorkbook workbook,
        string worksheetName,
        string firstColumnHeading,
        IReadOnlyList<ReportChartItemResponse> items)
    {
        var worksheet = workbook.Worksheets.Add(worksheetName);

        AddWorksheetHeader(
            worksheet,
            firstColumnHeading,
            "Ticket Count");

        var rowNumber = 2;

        foreach (var item in items)
        {
            worksheet.Cell(rowNumber, 1).Value = item.Name;
            worksheet.Cell(rowNumber, 2).Value = item.Count;
            worksheet.Cell(rowNumber, 2).Style.NumberFormat.Format = "0";
            rowNumber++;
        }

        if (items.Count == 0)
        {
            worksheet.Range("A2:B2").Merge();
            worksheet.Cell("A2").Value = "No data available";
            worksheet.Cell("A2").Style.Font.FontColor =
                XLColor.FromHtml("#64748B");
            worksheet.Cell("A2").Style.Alignment.Horizontal =
                XLAlignmentHorizontalValues.Center;
            rowNumber++;
        }

        ApplyWorksheetTableStyle(
            worksheet,
            rowNumber - 1);

        worksheet.Column(1).Width = 34;
        worksheet.Column(2).Width = 18;
    }

    private static void AddVolumeWorksheet(
        XLWorkbook workbook,
        IReadOnlyList<ReportVolumeItemResponse> items)
    {
        var worksheet = workbook.Worksheets.Add("Ticket Volume");

        AddWorksheetHeader(
            worksheet,
            "Date",
            "Tickets Created");

        var rowNumber = 2;

        foreach (var item in items)
        {
            worksheet.Cell(rowNumber, 1).Value =
                item.Date.ToDateTime(TimeOnly.MinValue);

            worksheet.Cell(rowNumber, 1).Style.NumberFormat.Format =
                "yyyy-mm-dd";

            worksheet.Cell(rowNumber, 2).Value = item.Count;
            worksheet.Cell(rowNumber, 2).Style.NumberFormat.Format = "0";
            rowNumber++;
        }

        if (items.Count == 0)
        {
            worksheet.Range("A2:B2").Merge();
            worksheet.Cell("A2").Value = "No data available";
            rowNumber++;
        }

        ApplyWorksheetTableStyle(
            worksheet,
            rowNumber - 1);

        worksheet.Column(1).Width = 18;
        worksheet.Column(2).Width = 20;
    }

    private static void AddWorksheetHeader(
        IXLWorksheet worksheet,
        string firstColumnHeading,
        string secondColumnHeading)
    {
        worksheet.Cell(1, 1).Value = firstColumnHeading;
        worksheet.Cell(1, 2).Value = secondColumnHeading;
        worksheet.Range("A1:B1").Style.Font.Bold = true;
        worksheet.Range("A1:B1").Style.Font.FontColor = XLColor.White;
        worksheet.Range("A1:B1").Style.Fill.BackgroundColor =
            XLColor.FromHtml("#1D4ED8");
        worksheet.SheetView.FreezeRows(1);
    }

    private static void ApplyWorksheetTableStyle(
        IXLWorksheet worksheet,
        int lastRow)
    {
        var range = worksheet.Range(1, 1, lastRow, 2);

        range.Style.Border.OutsideBorder =
            XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorder =
            XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor =
            XLColor.FromHtml("#CBD5E1");
        range.Style.Border.InsideBorderColor =
            XLColor.FromHtml("#E2E8F0");
    }

    private static Document CreatePdfDocument(
        ReportSummaryResponse report,
        DateTime generatedAtUtc)
    {
        var document = new Document();
        document.Info.Title = ReportTitle;
        document.Info.Subject =
            "Help desk ticket analytics export";

        ConfigurePdfStyles(document);

        var section = document.AddSection();
        section.PageSetup.PageFormat = PageFormat.A4;
        section.PageSetup.TopMargin = Unit.FromCentimeter(1.5);
        section.PageSetup.BottomMargin = Unit.FromCentimeter(1.5);
        section.PageSetup.LeftMargin = Unit.FromCentimeter(1.6);
        section.PageSetup.RightMargin = Unit.FromCentimeter(1.6);

        var footer = section.Footers.Primary.AddParagraph();
        footer.Format.Alignment = ParagraphAlignment.Center;
        footer.Format.Font.Size = Unit.FromPoint(8);
        footer.Format.Font.Color = Colors.Gray;
        footer.AddText("IT HelpDesk - Page ");
        footer.AddPageField();

        var brand = section.AddParagraph();
        brand.Format.Font.Size = Unit.FromPoint(11);
        brand.Format.Font.Bold = true;
        brand.Format.Font.Color = Colors.DarkBlue;
        brand.AddText("IT HelpDesk");

        var title = section.AddParagraph("Reports & Analytics");
        title.Style = PdfTitleStyle;

        var period = section.AddParagraph();
        period.Format.SpaceAfter = Unit.FromPoint(2);
        period.AddFormattedText("Reporting period: ", TextFormat.Bold);
        period.AddText(
            $"{report.From:yyyy-MM-dd} through {report.To:yyyy-MM-dd}");

        var generated = section.AddParagraph();
        generated.Format.SpaceAfter = Unit.FromPoint(14);
        generated.AddFormattedText("Generated: ", TextFormat.Bold);
        generated.AddText(
            $"{generatedAtUtc:yyyy-MM-dd HH:mm:ss} UTC");

        AddPdfHeading(section, "Summary");

        var summaryItems = new (string Label, string Value)[]
        {
            ("Total Tickets", report.TotalTickets.ToString()),
            ("Open", report.OpenTickets.ToString()),
            ("In Progress", report.InProgressTickets.ToString()),
            ("Pending", report.PendingTickets.ToString()),
            ("Resolved", report.ResolvedTickets.ToString()),
            ("Closed", report.ClosedTickets.ToString()),
            ("Cancelled", report.CancelledTickets.ToString()),
            ("Average Resolution Time", FormatDuration(
                report.AverageResolutionMinutes))
        };

        AddPdfTable(
            section,
            "Metric",
            "Value",
            summaryItems);

        AddPdfHeading(section, "Tickets by Status");
        AddPdfTable(
            section,
            "Status",
            "Ticket Count",
            report.TicketsByStatus.Select(item =>
                (item.Name, item.Count.ToString())));

        AddPdfHeading(section, "Tickets by Priority");
        AddPdfTable(
            section,
            "Priority",
            "Ticket Count",
            report.TicketsByPriority.Select(item =>
                (item.Name, item.Count.ToString())));

        AddPdfHeading(section, "Tickets by Category");
        AddPdfTable(
            section,
            "Category",
            "Ticket Count",
            report.TicketsByCategory.Select(item =>
                (item.Name, item.Count.ToString())));

        AddPdfHeading(section, "Ticket Volume Over Time");
        AddPdfTable(
            section,
            "Date",
            "Tickets Created",
            report.TicketVolume.Select(item =>
                (item.Date.ToString("yyyy-MM-dd"),
                    item.Count.ToString())));

        return document;
    }

    private static void ConfigurePdfStyles(
        Document document)
    {
        var normal = document.Styles[StyleNames.Normal]!;
        normal.Font.Name = "Arial";
        normal.Font.Size = Unit.FromPoint(9);

        var title = document.Styles.AddStyle(
            PdfTitleStyle,
            StyleNames.Normal);
        title.Font.Name = "Arial";
        title.Font.Size = Unit.FromPoint(22);
        title.Font.Bold = true;
        title.Font.Color = Colors.DarkBlue;
        title.ParagraphFormat.SpaceAfter = Unit.FromPoint(8);
    }

    private static void AddPdfHeading(
        Section section,
        string heading)
    {
        var paragraph = section.AddParagraph(heading);
        paragraph.Format.Font.Size = Unit.FromPoint(13);
        paragraph.Format.Font.Bold = true;
        paragraph.Format.Font.Color = Colors.DarkBlue;
        paragraph.Format.SpaceBefore = Unit.FromPoint(14);
        paragraph.Format.SpaceAfter = Unit.FromPoint(6);
        paragraph.Format.KeepWithNext = true;
    }

    private static void AddPdfTable(
        Section section,
        string firstColumnHeading,
        string secondColumnHeading,
        IEnumerable<(string Label, string Value)> items)
    {
        var itemList = items.ToList();
        var table = section.AddTable();
        table.Borders.Color = Colors.LightGray;
        table.Borders.Width = Unit.FromPoint(0.5);
        table.Rows.LeftIndent = Unit.Zero;

        table.AddColumn(Unit.FromCentimeter(11.5));
        table.AddColumn(Unit.FromCentimeter(5));

        var header = table.AddRow();
        header.HeadingFormat = true;
        header.Format.Font.Bold = true;
        header.Format.Font.Color = Colors.White;
        header.Shading.Color = Colors.DarkBlue;
        header.TopPadding = Unit.FromPoint(4);
        header.BottomPadding = Unit.FromPoint(4);
        header.Cells[0].AddParagraph(firstColumnHeading);
        header.Cells[1].AddParagraph(secondColumnHeading);
        header.Cells[1].Format.Alignment = ParagraphAlignment.Right;

        if (itemList.Count == 0)
        {
            var emptyRow = table.AddRow();
            emptyRow.Cells[0].MergeRight = 1;
            emptyRow.Cells[0].AddParagraph("No data available");
            emptyRow.Cells[0].Format.Alignment =
                ParagraphAlignment.Center;
            emptyRow.Cells[0].Format.Font.Color = Colors.Gray;
            emptyRow.TopPadding = Unit.FromPoint(5);
            emptyRow.BottomPadding = Unit.FromPoint(5);
            return;
        }

        foreach (var item in itemList)
        {
            var row = table.AddRow();
            row.TopPadding = Unit.FromPoint(3);
            row.BottomPadding = Unit.FromPoint(3);
            row.Cells[0].AddParagraph(item.Label);
            row.Cells[1].AddParagraph(item.Value);
            row.Cells[1].Format.Alignment = ParagraphAlignment.Right;
        }
    }

    private static string FormatDuration(
        double? minutes)
    {
        if (!minutes.HasValue)
        {
            return "Unavailable";
        }

        var totalMinutes = Math.Max(
            0,
            (int)Math.Round(minutes.Value));

        if (totalMinutes < 60)
        {
            return $"{totalMinutes} min";
        }

        var totalHours = totalMinutes / 60;
        var remainingMinutes = totalMinutes % 60;

        if (totalHours < 24)
        {
            return remainingMinutes > 0
                ? $"{totalHours} hr {remainingMinutes} min"
                : $"{totalHours} hr";
        }

        var days = totalHours / 24;
        var remainingHours = totalHours % 24;

        return remainingHours > 0
            ? $"{days} day{(days == 1 ? string.Empty : "s")} " +
                $"{remainingHours} hr"
            : $"{days} day{(days == 1 ? string.Empty : "s")}";
    }
}
