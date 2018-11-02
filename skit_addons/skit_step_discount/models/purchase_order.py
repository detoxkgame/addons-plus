# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    step_discount_line = fields.Many2many(
            'skit.step.discount',
            string='Step Discount')
    actual_price = fields.Float(compute='_compute_amount_line_all',
                                digits=0,
                                string='Actual Price')

    @api.depends('price_unit', 'tax_ids', 'qty', 'discount', 'product_id')
    def _compute_amount_line_all(self):
        for line in self:
            fpos = line.order_id.fiscal_position_id
            tax_ids_after_fiscal_position = fpos.map_tax(line.tax_ids, line.product_id, line.order_id.partner_id) if fpos else line.tax_ids
            tax_ids_after_fp = tax_ids_after_fiscal_position
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            if line.step_discount_line and 'Step Discount' not in line.product_id.name:
                taxes = tax_ids_after_fp.skit_compute_all(price,
                                                          line.step_discount_line,
                                                          line.order_id.pricelist_id.currency_id,
                                                          line.qty, product=line.product_id, 
                                                          partner=line.order_id.partner_id)
            else:
                taxes = tax_ids_after_fp.compute_all(price,
                                                     line.order_id.pricelist_id.currency_id,
                                                     line.qty, product=line.product_id,
                                                     partner=line.order_id.partner_id)
            actual_price = (line.price_unit * line.qty)
            line.update({
                'price_subtotal_incl': taxes['total_included'],
                'price_subtotal': taxes['total_excluded'],
                'actual_price': actual_price,
            })


class PurchaseOrderLine(models.Model):
    _inherit = 'purchase.order.line'

    step_discount = fields.Many2many(
            'skit.step.discount',
            string='Step Discount')
    @api.depends('product_qty', 'price_unit', 'taxes_id', 'step_discount')
    def _compute_amount(self):
        """
        Method used to compute price of line.
        """
        for line in self:
            if line.step_discount:
                taxes = line.taxes_id.skit_compute_all(line.price_unit, line.step_discount, line.order_id.currency_id, line.product_qty, product=line.product_id, partner=line.order_id.partner_id)
            else:
                taxes = line.taxes_id.compute_all(line.price_unit, line.order_id.currency_id, line.product_qty, product=line.product_id, partner=line.order_id.partner_id)
            line.update({
                'price_tax': taxes['total_included'] - taxes['total_excluded'],
                'price_total': taxes['total_included'],
                'price_subtotal': taxes['total_excluded'],
            })


class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    amount_discount = fields.Monetary(
        string="Discount",
        store=True,
        readonly=True,
        compute='_amount_all',
        help='shows the discount amount'
    )

    @api.depends('order_line.price_total')
    def _amount_all(self):
        """ Update order total amount"""
        super(PurchaseOrder, self)._amount_all()
        for order in self:
            amount_untaxed = amount_tax = 0.0
            amount_discount = 0.0
            for line in order.order_line:
                amount_untaxed += line.price_subtotal
                # FORWARDPORT UP TO 10.0
                if order.company_id.tax_calculation_rounding_method == 'round_globally':
                    taxes = line.taxes_id.compute_all(line.price_unit, line.order_id.currency_id, line.product_qty, product=line.product_id, partner=line.order_id.partner_id)
                    amount_tax += sum(t.get('amount', 0.0) for t in taxes.get('taxes', []))
                else:
                    amount_tax += line.price_tax
                amount_discount += ((line.product_qty * line.price_unit))
            order.amount_discount = amount_discount - amount_untaxed
            order.update({
                'amount_untaxed': order.currency_id.round(amount_untaxed),
                'amount_tax': order.currency_id.round(amount_tax),
                'amount_total': amount_untaxed + amount_tax,
            })


class AccountInvoiceLine(models.Model):
    """ Override AccountInvoice_line to add the link to the purchase order line
              it is related to"""
    _inherit = 'account.invoice.line'
    _description = "Invoice Line"

    step_discount = fields.Many2many('skit.step.discount', string="Discount")

    @api.one
    @api.depends('price_unit', 'discount', 'invoice_line_tax_ids', 'quantity',
                 'product_id', 'invoice_id.partner_id',
                 'invoice_id.currency_id',
                 'invoice_id.company_id',
                 'invoice_id.date_invoice', 'invoice_id.date')
    def _compute_price(self):
        """ Compute method, to calculate the price_subtotal of invoice line.

        """
        currency = self.invoice_id and self.invoice_id.currency_id or None
        price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)
        taxes = False
        if self.invoice_line_tax_ids:
            if self.step_discount:
                taxes = self.invoice_line_tax_ids.skit_compute_all(price,self.step_discount, currency, self.quantity, product=self.product_id, partner=self.invoice_id.partner_id)
            else:
                taxes = self.invoice_line_tax_ids.compute_all(price, currency, self.quantity, product=self.product_id, partner=self.invoice_id.partner_id)
        if self.step_discount:
            discount_value = 0
            disc_amount = 0
            for disc in self.step_discount:
                val = disc.discount_percentage
                if (discount_value == 0):
                    discount = ((val * (self.quantity * price)) / 100)
                    discount_value = (self.quantity * price) - discount
                else:
                    discount = ((val * discount_value) / 100)
                    discount_value = discount_value - discount
                continue
            disc_amount += discount_value
            # disc_val = disc.discount_percentage
            # price_subtotal = self.quantity * price
            self.price_subtotal = price_subtotal_signed = taxes['total_excluded'] if taxes else (disc_amount)
        else:
            self.price_subtotal = price_subtotal_signed = taxes['total_excluded'] if taxes else self.quantity * price
        if self.invoice_id.currency_id and self.invoice_id.company_id and self.invoice_id.currency_id != self.invoice_id.company_id.currency_id:
            price_subtotal_signed = self.invoice_id.currency_id.with_context(date=self.invoice_id._get_currency_rate_date()).compute(price_subtotal_signed, self.invoice_id.company_id.currency_id)
        sign = self.invoice_id.type in ['in_refund', 'out_refund'] and -1 or 1
        self.price_subtotal_signed = price_subtotal_signed * sign


class AccountInvoice(models.Model):
    _inherit = 'account.invoice'
    _description = "Invoice"
    amount_discount = fields.Monetary(string="Discount", readonly=True,
                                      compute='_compute_amount', store=True)

    @api.multi
    def _prepare_invoice_line_from_po_line(self, line):
        """ Prepare invoice line from po line
            Pass the step_discount value to invoice line.
            To apply discount in invoice.
            @param  po line: purchase order line
        """

        data = super(AccountInvoice, self)._prepare_invoice_line_from_po_line(line)
        disc = line.step_discount
        data['step_discount'] = disc.ids
        return data

    @api.multi
    def get_taxes_values(self):
        """
            Create a tax from invoice lines.
            If step discount applied for invoice line ,then apply tax after 
            discount applied for amount.

        """
        tax_grouped = {}
        for line in self.invoice_line_ids:
            price_unit = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            if line.step_discount:
                taxes = line.invoice_line_tax_ids.skit_compute_all(price_unit, line.step_discount, self.currency_id, line.quantity, line.product_id, self.partner_id)['taxes']
            else:
                taxes = line.invoice_line_tax_ids.compute_all(price_unit, self.currency_id, line.quantity, line.product_id, self.partner_id)['taxes']
            for tax in taxes:
                val = self._prepare_tax_line_vals(line, tax)
                key = self.env['account.tax'].browse(tax['id']).get_grouping_key(val)
                if key not in tax_grouped:
                    tax_grouped[key] = val
                else:
                    tax_grouped[key]['amount'] += val['amount']
                    tax_grouped[key]['base'] += val['base']
        return tax_grouped
    
    @api.one
    @api.depends('invoice_line_ids.price_subtotal', 'tax_line_ids.amount', 'tax_line_ids.amount_rounding',
                 'currency_id', 'company_id', 'date_invoice', 'type')
    def _compute_amount(self):
        super(AccountInvoice, self)._compute_amount()
        pos_order = self.env['pos.order'].search(
                        [('invoice_id', '=', self.id)])
        credit_charge = 0
        if pos_order and  'credit_card_charge_amount' in self.env['account.bank.statement.line']._fields:
            for pos in pos_order:
                if pos.statement_ids:
                    credit_amt = 0
                    original_amount = 0
                    for statement in pos.statement_ids:
                        if statement.journal_id.code == 'cc' or statement.journal_id.code == 'CC':
                            # card_charge = statement.journal_id.credit_card_charge
                            credit_amt+= statement.credit_card_charge_amount
                        original_amount += statement.amount
                    total_amt =  original_amount
                    credit_charge = (credit_amt)
            self.credit_card_charges = credit_charge
        self.amount_total = self.amount_untaxed + self.amount_tax + credit_charge        
        amount_total_company_signed = self.amount_total
        amount_untaxed_signed = self.amount_untaxed
        if 'amount_discount' in self.env['account.invoice']._fields:
            self.amount_discount = (sum((line.quantity * line.price_unit) for line in self.invoice_line_ids)) - self.amount_untaxed
        if self.currency_id and self.company_id and self.currency_id != self.company_id.currency_id:
            currency_id = self.currency_id
            amount_total_company_signed = currency_id._convert(self.amount_total, self.company_id.currency_id, self.company_id, self.date_invoice or fields.Date.today())
            amount_untaxed_signed = currency_id._convert(self.amount_untaxed, self.company_id.currency_id, self.company_id, self.date_invoice or fields.Date.today())
        sign = self.type in ['in_refund', 'out_refund'] and -1 or 1
        self.amount_total_company_signed = amount_total_company_signed * sign
        self.amount_total_signed = self.amount_total * sign
        self.amount_untaxed_signed = amount_untaxed_signed * sign


   
class AcountTax(models.Model):
    _inherit = 'account.tax'

    @api.multi
    def skit_compute_all(self, price_unit, step_discount, currency=None, quantity=1.0, product=None, partner=None):
        """ Returns all information required to apply taxes (in self + their children in case of a tax goup).
            We consider the sequence of the parent for group of taxes.
                Eg. considering letters as taxes and alphabetic order as sequence :
                [G, B([A, D, F]), E, C] will be computed as [A, D, F, C, E, G]

        RETURN: {
            'total_excluded': 0.0,    # Total without taxes
            'total_included': 0.0,    # Total with taxes
            'taxes': [{               # One dict for each tax in self and their children
                'id': int,
                'name': str,
                'amount': float,
                'sequence': int,
                'account_id': int,
                'refund_account_id': int,
                'analytic': boolean,
            }]
        } """
        if len(self) == 0:
            company_id = self.env.user.company_id
        else:
            company_id = self[0].company_id
        if not currency:
            currency = company_id.currency_id
        taxes = []
        # By default, for each tax, tax amount will first be computed
        # and rounded at the 'Account' decimal precision for each
        # PO/SO/invoice line and then these rounded amounts will be
        # summed, leading to the total amount for that tax. But, if the
        # company has tax_calculation_rounding_method = round_globally,
        # we still follow the same method, but we use a much larger
        # precision when we round the tax amount for each line (we use
        # the 'Account' decimal precision + 5), and that way it's like
        # rounding after the sum of the tax amounts of each line
        prec = currency.decimal_places

        # In some cases, it is necessary to force/prevent the rounding of the tax and the total
        # amounts. For example, in SO/PO line, we don't want to round the price unit at the
        # precision of the currency.
        # The context key 'round' allows to force the standard behavior.
        round_tax = False if company_id.tax_calculation_rounding_method == 'round_globally' else True
        round_total = True
        if 'round' in self.env.context:
            round_tax = bool(self.env.context['round'])
            round_total = bool(self.env.context['round'])

        if not round_tax:
            prec += 5

        base_values = self.env.context.get('base_values')
        if not base_values:
            discount_value = 0
            disc_amount = 0
            for disc in step_discount:
                val = disc.discount_percentage
                if (discount_value == 0):
                    discount = ((val * (price_unit * quantity)) / 100)
                    discount_value = (price_unit * quantity) - discount
                else:
                    discount = ((val * discount_value) / 100)
                    discount_value = discount_value - discount
                continue
            disc_amount += discount_value
            total_excluded = total_included = base = disc_amount
        else:
            total_excluded, total_included, base = base_values

        # Sorting key is mandatory in this case. When no key is provided, sorted() will perform a
        # search. However, the search method is overridden in account.tax in order to add a domain
        # depending on the context. This domain might filter out some taxes from self, e.g. in the
        # case of group taxes.
        for tax in self.sorted(key=lambda r: r.sequence):
            if tax.amount_type == 'group':
                children = tax.children_tax_ids.with_context(base_values=(total_excluded, total_included, base))
                ret = children.compute_all(price_unit, currency, quantity, product, partner)
                total_excluded = ret['total_excluded']
                base = ret['base'] if tax.include_base_amount else base
                total_included = ret['total_included']
                tax_amount = total_included - total_excluded
                taxes += ret['taxes']
                continue
            tax_amount = tax._compute_amount(base, price_unit, quantity, product, partner)
            if not round_tax:
                tax_amount = round(tax_amount, prec)
            else:
                tax_amount = currency.round(tax_amount)

            if tax.price_include:
                total_excluded -= tax_amount
                base -= tax_amount
            else:
                total_included += tax_amount
            # Keep base amount used for the current tax
            tax_base = base
            if tax.include_base_amount:
                base += tax_amount
            taxes.append({
                'id': tax.id,
                'name': tax.with_context(**{'lang': partner.lang} if partner else {}).name,
                'amount': tax_amount,
                'base': tax_base,
                'sequence': tax.sequence,
                'account_id': tax.account_id.id,
                'refund_account_id': tax.refund_account_id.id,
                'analytic': tax.analytic,
            })
        return {
            'taxes': sorted(taxes, key=lambda k: k['sequence']),
            'total_excluded': currency.round(total_excluded) if round_total else total_excluded,
            'total_included': currency.round(total_included) if round_total else total_included,
            'base': base,
        }