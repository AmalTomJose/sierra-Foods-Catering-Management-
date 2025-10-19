// controllers/admin/salesReportController.js
const Order = require('../models/orderModel');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');


const   renderPage = (req, res) => {
  res.render('admin/dashboard/salesReport', { report: null });
};

const getFilteredReport = async (req, res) => {
  try {
    console.log("Hi this is a testing");
    console.log(req.body);
    const { rangeType, startDate, endDate } = req.body;

    const filter = { status: 'delivered' };

    let start, end;
    if (rangeType === 'custom') {
      start = moment.utc(startDate).startOf('day').toDate();
      end = moment.utc(endDate).endOf('day').toDate();
    } else if (rangeType === 'today') {
      start = moment.utc().startOf('day').toDate();
      end = moment.utc().endOf('day').toDate();
    } else if (rangeType === 'week') {
      start = moment.utc().startOf('week').toDate();
      end = moment.utc().endOf('week').toDate();
    } else if (rangeType === 'month') {
      start = moment.utc().startOf('month').toDate();
      end = moment.utc().endOf('month').toDate();
    } else {
      return res.status(400).send('Invalid range');
    }
    console.log(start);
    console.log(end);
    
    filter.createdAt = { $gte: start, $lt: end };
    console.log(filter);


    const orders = await Order.find(filter).populate('user');

    const totalSales = orders.length;
    const totalAmount = orders.reduce((acc, order) =>  acc + order.finalAmount, 0);
    const totalDiscount = orders.reduce((acc, order) => acc + (order.couponDiscount || 0), 0);

    res.render('admin/dashboard/salesReport', {
      report: {
        orders,
        totalSales,
        totalAmount,
        totalDiscount,
        rangeType,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send('Internal Server Error');
  }
};


const downloadReport = async (req, res) => {
    const { type } = req.params;
    const { rangeType, startDate, endDate } = req.query;
  
    let start, end;
    if (rangeType === 'custom') {
      start = moment.utc(startDate).startOf('day').toDate();
      end = moment.utc(endDate).endOf('day').toDate();
    } else if (rangeType === 'today') {
      start = moment.utc().startOf('day').toDate();
      end = moment.utc().endOf('day').toDate();
    } else if (rangeType === 'week') {
      start = moment.utc().startOf('week').toDate();
      end = moment.utc().endOf('week').toDate();
    } else if (rangeType === 'month') {
      start = moment.utc().startOf('month').toDate();
      end = moment.utc().endOf('month').toDate();
    } else {
      return res.status(400).send('Invalid range');
    }
  
    const orders = await Order.find({
      status: "delivered",
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).populate('user');
    console.log('This is  a test',orders)
  
    if (type === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sales Report');
  
      sheet.columns = [
        { header: 'Order ID', key: 'id' },
        { header: 'Customer', key: 'customer' },
        { header: 'Amount', key: 'amount' },
        { header: 'Discount', key: 'discount' },
        { header: 'Created At', key: 'createdAt' }
      ];
  
      orders.forEach(order => {
        sheet.addRow({
          id: order._id.toString(),
          customer: order.user?.firstname || 'Guest',
          amount: order.finalAmount,
          discount: order.couponDiscount || 0,
          createdAt: moment(order.createdAt).format('YYYY-MM-DD')
        });
      });
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else if (type === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
      doc.pipe(res);
    
      doc.fontSize(16).text("Sales Report", { align: "center" });
      doc.moveDown();
    
      // Create table
      const table = {
        headers: ["Order ID", "Amount (₹)", "Discount (₹)"],
        rows: orders.map(order => [
          order._id.toString(),
          order.totalAmount,
          order.discount || 0
        ])
      };
    
      doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(10),
      });
    
      doc.end();
    }
  };
  

  module.exports = {
    renderPage,
    getFilteredReport,
    downloadReport


  }