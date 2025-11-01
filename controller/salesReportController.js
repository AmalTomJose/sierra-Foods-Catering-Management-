// controllers/admin/salesReportController.js
const Order = require('../models/orderModel');
// const moment = require('moment');
const moment = require("moment-timezone");

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');

const renderPage = (req, res) => {
  res.render('admin/dashboard/salesReport', {
    report: {
      orders: [],
      totalSales: 0,
      totalAmount: 0,
      totalDiscount: 0,
      rangeType: "",
      startDate: "",
      endDate: "",
    },
    totalPages: 0,
    currentPage: 1,
  });
};




const getFilteredReport = async (req, res) => {
  try {
    const { rangeType, startDate, endDate } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const filter = { status: "delivered" };

    let start, end;
    const now = moment().tz("Asia/Kolkata");

    if (rangeType === "custom") {
      start = moment.tz(startDate, "Asia/Kolkata").startOf("day").toDate();
      end = moment.tz(endDate, "Asia/Kolkata").endOf("day").toDate();
    } else if (rangeType === "today") {
      start = now.clone().startOf("day").toDate();
      end = now.clone().endOf("day").toDate();
    } else if (rangeType === "week") {
      start = now.clone().startOf("isoWeek").toDate(); // Monday
      end = now.clone().endOf("isoWeek").toDate();     // Sunday
    } else if (rangeType === "month") {
      start = now.clone().startOf("month").toDate();
      end = now.clone().endOf("month").toDate();
    } else {
      return res.status(400).send("Invalid range");
    }

    filter.createdAt = { $gte: start, $lt: end };

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(filter)
      .populate("user")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAmountAgg = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalDiscount: { $sum: { $ifNull: ["$couponDiscount", 0] } },
        },
      },
    ]);

    const totalAmount = totalAmountAgg[0]?.totalAmount || 0;
    const totalDiscount = totalAmountAgg[0]?.totalDiscount || 0;

    const data = {
      report: {
        orders,
        totalSales: totalOrders,
        totalAmount,
        totalDiscount,
        rangeType,
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      totalPages,
      currentPage: page,
    };

    if (req.xhr) {
      return res.render("partials/admin/salesReportTable", {
        report: data.report,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        layout: false
      });
    }
    

    res.render("admin/dashboard/salesReport", {
      report: data.report,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      data,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};





const downloadReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { rangeType, startDate, endDate } = req.query;

    let start, end;
    if (rangeType === "custom") {
      start = moment.utc(startDate).startOf("day").toDate();
      end = moment.utc(endDate).endOf("day").toDate();
    } else if (rangeType === "today") {
      start = moment.utc().startOf("day").toDate();
      end = moment.utc().endOf("day").toDate();
    } else if (rangeType === "week") {
      start = moment.utc().startOf("week").toDate();
      end = moment.utc().endOf("week").toDate();
    } else if (rangeType === "month") {
      start = moment.utc().startOf("month").toDate();
      end = moment.utc().endOf("month").toDate();
    } else {
      return res.status(400).send("Invalid range");
    }

    const orders = await Order.find({
      status: { $in: ["delivered", "confirmed"] }, // include confirmed too if needed
      createdAt: { $gte: start, $lte: end },
    })
      .populate("user", "firstname lastname email")
      .populate("items.product", "item_name");

    if (!orders || orders.length === 0) {
      return res.status(404).send("No orders found in the selected range");
    }

    // ===============================
    // 📊 GENERATE EXCEL REPORT
    // ===============================
    if (type === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sales Report");

      // Columns
      sheet.columns = [
        { header: "Order ID", key: "id", width: 20 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Items Ordered", key: "items", width: 40 },
        { header: "Total (₹)", key: "total", width: 15 },
        { header: "Coupon Discount (₹)", key: "discount", width: 20 },
        { header: "Final Amount (₹)", key: "final", width: 20 },
        { header: "Payment Method", key: "method", width: 20 },
        { header: "Payment Status", key: "payment", width: 20 },
        { header: "Order Status", key: "status", width: 20 },
        { header: "Order Date", key: "date", width: 20 },
      ];

      // Rows
      orders.forEach((order) => {
        const itemsList = order.items
          .map(
            (i) =>
              `${i.product?.item_name || "N/A"} (x${i.quantity})`
          )
          .join(", ");

        sheet.addRow({
          id: order.orderId,
          customer: order.user
            ? `${order.user.firstname} ${order.user.lastname}`
            : "Guest",
          items: itemsList,
          total: order.totalAmount.toFixed(2),
          discount: order.couponDiscount.toFixed(2),
          final: order.finalAmount.toFixed(2),
          method: order.paymentMethod.toUpperCase(),
          payment: order.paymentStatus.toUpperCase(),
          status: order.status.toUpperCase(),
          date: moment(order.createdAt).format("YYYY-MM-DD HH:mm"),
        });
      });

      // Header Style
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF007ACC" },
        };
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.xlsx"
      );
      await workbook.xlsx.write(res);
      res.end();

    // ===============================
    // 📄 GENERATE PDF REPORT
    // ===============================
    } else if (type === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.pdf"
      );
      doc.pipe(res);

      doc.fontSize(18).text("📦 Sales Report", { align: "center" });
      doc.moveDown();

      const table = {
        headers: [
          "Order ID",
          "Customer",
          "Items Ordered",
          "Final (₹)",
          "Method",
          "Status",
          "Date",
        ],
        rows: orders.map((order) => [
          order.orderId,
          order.user
            ? `${order.user.firstname} ${order.user.lastname}`
            : "Guest",
          order.items
            .map((i) => `${i.product?.item_name || "N/A"} (x${i.quantity})`)
            .join(", "),
          order.finalAmount.toFixed(2),
          order.paymentMethod.toUpperCase(),
          order.status.toUpperCase(),
          moment(order.createdAt).format("YYYY-MM-DD"),
        ]),
      };

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, i) =>
          doc.font("Helvetica").fontSize(9).fillColor(i % 2 ? "black" : "black"),
      });

      doc.end();
    } else {
      return res.status(400).send("Invalid report type");
    }
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};



  module.exports = {
    renderPage,
    getFilteredReport,
    downloadReport


  }