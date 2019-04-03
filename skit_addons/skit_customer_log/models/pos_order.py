# -*- coding: utf-8 -*-
from odoo import api, models, fields


class Skit_PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def fetch_customer_order(self, customer, session_id):
        """ Serialize the orders of the customer.
        get the sales,POS order and without order in invoice.
        params: customer int representing the customer id
        """
        params = {'partner_id': customer}
        # Generate Order Details
        sql_query = """ select  x.order_id, x.date_order, x.type  from (
                        select id as order_id,date_order,'SO'as type
                        from sale_order
                        where partner_id = %(partner_id)s
                        union
                        select id as order_id,date_order,'POS'as type
                        from pos_order
                        where partner_id = %(partner_id)s
                        union
                        select id as order_id,date_invoice as date_order,
                        ''as type
                        from account_invoice
                        where type not in ('in_invoice' , 'in_refund')
                        and partner_id = %(partner_id)s  and name is null
                        )
                        as x order by x.date_order desc"""

        self._cr.execute(sql_query, params)
        rows = self._cr.dictfetchall()
        datas = self.get_orderdata(rows, session_id)

        result = {'orders': datas}
        return result

    @api.model
    def get_orderdata(self, rows, session_id):
        """ Serialize all orders of the customer.
        list of the sales,POS order and without order in invoice.
        params: rows - list of orders
        """
        datas = []
        sno = 0
        so_ids = [x['order_id'] for x in rows if x['type'] == "SO"]
        pos_ids = [x['order_id'] for x in rows if x['type'] == "POS"]
        invoice_ids = [x['order_id'] for x in rows if x['type'] == ""]
        sorders = self.env['sale.order'].search([('id', 'in', so_ids)])
        porders = self.env['pos.order'].search([('id', 'in', pos_ids)])
        invoice = self.env['account.invoice'].search([
                                                ('id', 'in', invoice_ids)])
        allorders = {'SO': sorders, 'POS': porders, 'Invoice': invoice}
        for key, orders in allorders.items():
            for order in orders:
                sno = sno + 1
                dateorder = False
                if key == 'SO':
                    session_id = 0
                    invoice_cancel = False
                    invoices = self.env['account.invoice'].search([
                                        ('id', 'in', order.invoice_ids.ids)])
                    dateorder = fields.Date.from_string(order.date_order)
                    if(order.state == 'draft'):
                        state = 'Quotation'
                    elif(order.state == 'sent'):
                        state = 'Quotation Sent'
                    elif(order.state == 'sale'):
                        state = 'Sales Order'
                    elif(order.state == 'done'):
                        state = 'Locked'
                    else:
                        state = 'Cancelled'
                elif key == 'POS':
                    session_id = order.session_id.id
                    invoice_cancel = True if order.invoice_id.state == 'cancel' else False
                    invoices = self.env['account.invoice'].search([
                                        ('id', 'in', order.invoice_id.ids)])
                    dateorder = fields.Date.from_string(order.date_order)
                    if(order.state == 'draft'):
                        state = 'New'
                    elif(order.state == 'cancel'):
                        state = 'Cancelled'
                    elif(order.state == 'paid'):
                        state = 'Paid'
                    elif(order.state == 'done'):
                        state = 'Posted'
                    else:
                        state = 'Invoiced'
                else:
                    session_id = 0
                    invoice_cancel = False
                    invoices = self.env['account.invoice'].search([
                                                    ('id', '=', order.id)])
                    dateorder = fields.Date.from_string(order.date_invoice)
                    if(order.state == 'draft'):
                        state = 'Draft'
                    elif(order.state == 'proforma'):
                        state = 'Pro-forma'
                    elif(order.state == 'proforma2'):
                        state = 'Pro-forma'
                    elif(order.state == 'open'):
                        state = 'Open'
                    elif(order.state == 'paid'):
                        state = 'Paid'
                    else:
                        state = 'Cancelled'
                if dateorder:
                    dateorder = dateorder.strftime("%Y/%m/%d")
                else:
                    dateorder = ''
                if invoices:
                    for invoice in invoices:
                        datas.append({
                                'id': order.id,
                                'sno': sno,
                                'type': key,
                                'invoice_ref': invoice.number,
                                'invoice_id': invoice.id,
                                'amount_total': round(order.amount_total, 2),
                                'date_order': dateorder,
                                'name': order.name or '',
                                'status': state,
                                'session_id': session_id,
                                'invoice_cancel': invoice_cancel})
                else:
                    datas.append({'id': order.id,
                                  'sno': sno,
                                  'type': key,
                                  'invoice_ref': '',
                                  'invoice_id': '',
                                  'amount_total': round(order.amount_total, 2),
                                  'date_order': dateorder,
                                  'name': order.name or '',
                                  'status': state,
                                  'session_id': session_id,
                                  'invoice_cancel': invoice_cancel
                                  })
        return datas

    @api.model
    def fetch_customer_olines(self, order_id, otype):
        """ Serialize the orders Lines of the customer

        params: customer int representing the customer id
        """
        if otype and otype == "SO":
            order = self.env['sale.order'].browse(int(order_id))
            oLines = order.order_line
            qty_column = 'product_uom_qty'
        elif otype == "POS":
            order = self.env['pos.order'].browse(int(order_id))
            oLines = order.lines
            qty_column = 'qty'
        else:
            order = self.env['account.invoice'].browse(int(order_id))
            oLines = order.invoice_line_ids
            qty_column = 'quantity'
        line = []
        sno = 0
        for oLine in oLines:
            sno = sno + 1
            qty = oLine[qty_column]
            line.append({
                'sno': sno,
                'id': oLine.id,
                'product': oLine.product_id.name,
                'qty': qty,
                'price_unit': oLine.price_unit,
            })
        return line
