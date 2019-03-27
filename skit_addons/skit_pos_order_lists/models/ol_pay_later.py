# -*- coding: utf-8 -*-
import logging
from odoo import api, models, fields

_logger = logging.getLogger(__name__)


class Skit_PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def fetch_partner_order_list(self, list_id, customer, session_id):
        """ Serialize the orders of the customer
            params: customer int representing the customer id
                list_id representing the order list or pending invoice
        """
        params = {'partner_id': customer}
        # Generate Order Details
        list_id = int(list_id)
        if (list_id > 0):
            # Pending invoice
            sql_query = """ select  x.order_id, x.date_order, x.type  from (
                        select id as order_id,date_order,'POS'as type
                        from pos_order
                        where partner_id = %(partner_id)s
                        )
                        as x order by x.date_order desc"""
        else:
            # All Order lists
            if customer:
                sql_query = """ select  x.order_id, x.date_order, x.type  from (
                        select id as order_id,date_order,'POS'as type
                        from pos_order
                        where partner_id = %(partner_id)s
                        )
                        as x order by x.date_order desc"""
            else:
                sql_query = """ select  x.order_id, x.date_order, x.type  from (
                            select id as order_id,date_order,'POS'as type
                            from pos_order
                            where
                            date_order > current_timestamp - interval '30 day' and
                            date_order < current_timestamp
                            )
                            as x order by x.date_order desc"""

        self._cr.execute(sql_query, params)
        rows = self._cr.dictfetchall()
        datas = self.get_all_order_datas(rows, session_id)
        if (list_id > 0):
            idatas = self.get_pending_invoice_rec(customer, session_id)
        else:
            idatas = datas

        result = {'orders': datas, 'pendinginvoice': idatas}
        return result

    @api.model
    def get_all_order_datas(self, rows, session_id):
        """ Serialize all orders of the devotee
            params: rows - list of orders
        """
        datas = []
        sno = 0
        pos_ids = [x['order_id'] for x in rows if x['type'] == "POS"]
        porders = self.env['pos.order'].search([('id', 'in', pos_ids)])
        allorders = {'POS': porders}
        for key, orders in allorders.items():
            for order in orders:
                sno = sno + 1
                dateorder = False
                if key == 'POS':
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
                session_id = order.session_id.id
                if dateorder:
                    dateorder = dateorder.strftime("%Y/%m/%d")
                else:
                    dateorder = ''
                if invoices:
                    for invoice in invoices:
                        dateinvoice = fields.Date.from_string(invoice.date_invoice)
                        if dateinvoice:
                            dateinvoice = dateinvoice.strftime("%Y/%m/%d")
                        else:
                            dateinvoice = ''
                        datas.append({
                                'porder_id': order.id,
                                'sno': sno,
                                'type': key,
                                'invoice_ref': invoice.number,
                                'invoice_id': invoice.id,
                                'date_invoice': dateinvoice,
                                'amount_total': round(order.amount_total, 2),
                                'date_order': dateorder,
                                'name': order.name or '',
                                'customer': order.partner_id.name,
                                'customer_id': order.partner_id.id,
                                'mobile': order.partner_id.mobile if order.partner_id.mobile else '',
                                'session_id': session_id,
                                'status': state,
                                })
                else:
                    datas.append({'porder_id': order.id,
                                  'sno': sno,
                                  'type': key,
                                  'invoice_ref': '',
                                  'invoice_id': '',
                                  'date_invoice': '',
                                  'amount_total': round(order.amount_total, 2),
                                  'date_order': dateorder,
                                  'name': order.name or '',
                                  'customer': order.partner_id.name,
                                  'customer_id': order.partner_id.id,
                                  'mobile': order.partner_id.mobile if order.partner_id.mobile else '',
                                  'session_id': session_id,
                                  'status': state,
                                  })
        return datas

    @api.model
    def get_pending_invoice_rec(self, partner_id, session_id):
        """ Fetch the pending invoice for current user
        params: partner - current user
        """
        idatas = []
        if int(partner_id) > 0:
            p_invoice = self.env['account.invoice'].search(
                                [('partner_id', '=', partner_id),
                                 ('type', 'not in', ('in_invoice', 'in_refund')),
                                 ('state', '=', 'open')])
        else:
            p_invoice = self.env['account.invoice'].search(
                                [('type', 'not in', ('in_invoice', 'in_refund')),
                                 ('state', '=', 'open')])
        isno = 0
        paid_amount = 0
        for invoice in p_invoice:
            isno = isno + 1
            posorder = self.env['pos.order'].search([
                            ('invoice_id', '=', invoice.id)])
            type = 'POS'
            paid_amount1 = 0
            paid_amount2 = 0
            if posorder:
                if posorder.statement_ids:
                    paid_amount1 = sum([x.amount for x in posorder.statement_ids if not x.journal_id.is_pay_later])
                account_payment = self.env['account.payment'].sudo().search(
                                       [('invoice_ids', 'in', invoice.id)])
                if account_payment:
                    paid_amount2 = sum([x.amount for x in account_payment if not x.journal_id.is_pay_later])
                paid_amount = paid_amount1 + paid_amount2
                dateinvoice = fields.Date.from_string(invoice.date_invoice)
                diff = (invoice.amount_total - paid_amount)
                amt = round(diff, 2)
                if diff == 0:
                    amt = 0
                if posorder.date_order:
                    dateorder = fields.Date.from_string(posorder.date_order)
                if dateorder:
                    dateorder = dateorder.strftime("%Y/%m/%d")
                else:
                    dateorder = ''
                idatas.append({'invoice_id': invoice.id,
                               'sno': isno,
                               'type': type,
                               'porder_id': posorder.id or '',
                               'date_order': dateorder,
                               'name': invoice.origin or '',
                               'invoice_ref': invoice.number,
                               'amount_total': round(invoice.amount_total, 2),
                               'unpaid_amount': amt if amt > 0 else '',
                               'date_invoice': dateinvoice.strftime("%Y/%m/%d"),
                               'customer': invoice.partner_id.name,
                               'customer_id': invoice.partner_id.id,
                               'mobile': invoice.partner_id.mobile if invoice.partner_id.mobile else '',
                               'status': invoice.state,
                               })
        return idatas

    @api.model
    def fetch_customer_olines(self, order_id, otype):
        """ Serialize the orders Lines of the customer

        params: customer int representing the customer id
        """

        if otype == "POS":
            order = self.env['pos.order'].browse(int(order_id))
            oLines = order.lines
            qty_column = 'qty'

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
                'amount': oLine.price_subtotal,
            })
        return line

    @api.model
    def fetch_pending_invoice_lines(self, invoice_id):
        """ Serialize the invoice Lines
        params: devotee int representing the invoice id
        """
        invoice = self.env['account.invoice'].browse(int(invoice_id))
        iLines = invoice.invoice_line_ids
        line = []
        sno = 0
        for iLine in iLines:
            sno = sno + 1
            line.append({
                'sno': sno,
                'id': iLine.id,
                'product': iLine.product_id.name,
                'qty': iLine.quantity,
                'price_unit': iLine.price_unit,
                'amount': iLine.price_subtotal
            })
        return line

    @api.model
    def get_order_orderlines(self, rec_order_id):
        """ Order Reprint Receipt"""
        discount = 0
        result = []
        order_id = self.search([('id', '=', rec_order_id)], limit=1)
        lines = self.env['pos.order.line'].search([('order_id', '=',
                                                    order_id.id)])
        payments = self.env['account.bank.statement.line'].search([
                            ('pos_statement_id', '=', order_id.id)])
        payment_lines = []
        orders = []
        for order in order_id:
            order_detail = {
                            'pos_reference': order.pos_reference,
                            'amount_total': order.amount_total,
                            'amount_tax': order.amount_tax,
                            'id': order.id,
                            'name': order.name,
                            'customer': order.partner_id.name,
                            'mobile': order.partner_id.mobile or ''
                            }
            orders.append(order_detail)
        change = 0
        for i in payments:
            if i.amount > 0:
                temp = {
                    'amount': i.amount,
                    'name': i.journal_id.name
                }
                payment_lines.append(temp)
            else:
                change += i.amount
        for line in lines:
            new_vals = {
                'product_id': line.product_id.name,
                'qty': line.qty,
                'price_unit': line.price_unit,
                'discount': line.discount,
                }
            discount += (line.price_unit * line.qty * line.discount) / 100
            result.append(new_vals)

        return [result, discount, payment_lines, orders, change]
