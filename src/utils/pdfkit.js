import fs from 'fs'
import PDFDocument from 'pdfkit'
import path from 'path'

function createInvoice(invoice, pathVar) {
  let doc = new PDFDocument({ size: 'A4', margin: 50 })

  generateHeader(doc)
  generateCustomerInformation(doc, invoice)
  generateInvoiceTable(doc, invoice)
  generateFooter(doc)

  doc.end()
  doc.pipe(fs.createWriteStream(path.resolve(`./Files/${pathVar}`)))
}

function generateHeader(doc) {
  doc
    .image('ecommerce.jpg', 50, 45, { width: 50 })
    .fillColor('#444444') // black
    .fontSize(20) // 20
    .text('matgar', 110, 57) // Route
    .fillColor('#09c')
    .fontSize(10)
    .text('matgar', 200, 50, { align: 'left' })
    .text('6 tahrir street', 200, 65, { align: 'left' })
    .text('Cairo,Egypt', 200, 80, { align: 'left' })
    .moveDown()
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor('#444444').fontSize(20).text('Invoice', 50, 160)

  generateHr(doc, 185)

  const customerInformationTop = 200

  doc
    .fontSize(10)
    .text('Order Code:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoice.orderCode, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 30)
    .text(formatDate(new Date(invoice.date)), 150, customerInformationTop + 30)
    .font('Helvetica-Bold')
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font('Helvetica')
    .text(invoice.shipping.address, 300, customerInformationTop + 15)
    .text(
      invoice.shipping.town +
        ', ' +
        invoice.shipping.city +
        ', ' +
        invoice.shipping.country,
      300,
      customerInformationTop + 30,
    )
    
    .moveDown()

  generateHr(doc, 252)
}

function generateInvoiceTable(doc, invoice) {
  let i
  const invoiceTableTop = 330

  doc.font('Helvetica-Bold')
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Unit Cost',
    'Discount',
    'Quantity',
    'Line Total',
  )
  generateHr(doc, invoiceTableTop + 20)
  doc.font('Helvetica')

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i]
    const position = invoiceTableTop + (i + 1) * 30
    generateTableRow(
      doc,
      position,
      item.name, // product name
      formatCurrency(item.price), // product price
      `${item.appliedDiscount}%`,
      item.quantity, // product quantity
      formatCurrency(item.priceAfterDiscount*item.quantity), // product final price
    )

    generateHr(doc, position + 20)
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Subtotal',
    '',
    formatCurrency(invoice.subTotal), // orderSubTotal
  )
  const couponDiscountPosition = subtotalPosition + 20
  generateTableRow(
    doc,
    couponDiscountPosition,
    '',
    '',
    'Coupon Discount',
    '',
    invoice.couponDiscount, 
  )
  const paidAmountPosition = couponDiscountPosition + 20
  generateTableRow(
    doc,
    paidAmountPosition,
    '',
    '',
    'Paid Amount',
    '',
    formatCurrency(invoice.paidAmount), // orderPaidAmount
  )
    
  doc.font('Helvetica')
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      'Payment is due within 15 days. Thank you for your business.',
      50,
      780,
      { align: 'center', width: 500 },
    )
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal,
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' })
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke()
}

function formatCurrency(cents) {
  return cents + 'EGP'
}

function formatDate(date) {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  return year + '/' + month + '/' + day
}

export default createInvoice