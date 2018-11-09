# -*- coding: utf-8 -*-

from odoo import fields, models, api, _
from odoo.exceptions import UserError


class AccountJournal(models.Model):
    _inherit = 'account.journal'
    _description = "Journal Account"

    credit_card_charge = fields.Float(string="Credit Card Charge %")
    default_credit_charge_id = fields.Many2one('account.account',
                                               string="Default Credit Charge",
                                               domain=[
                                                   ('deprecated', '=', False)],
                                               help="It acts as a default '.\
                                               'account for credit charge")


class SkitBankStatementLine(models.Model):
    _inherit = 'account.bank.statement.line'
    _description = "Bank Statement Line"

    credit_txt = fields.Float(string="Credit txt")
    credit_card_charge_amount = fields.Float(string="Credit Card Charge")
    
    
class PosOrder(models.Model):
    _inherit = 'pos.order'
    _description = "POS Order Inherited"

    credit_card_charges = fields.Float(string="Credit Card Charges",
                                       compute='_onchange_amount_all')

       
    @api.onchange('statement_ids', 'lines', 'lines')
    def _onchange_amount_all(self):
        """
        Calculate the total amount with credit card charge

        :rtype: dict.
        """
        super(PosOrder, self)._onchange_amount_all()
        for order in self:
            currency = order.pricelist_id.currency_id
            order.amount_paid = sum(payment.amount for payment in order.statement_ids)
            order.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in order.statement_ids)
            order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
            amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
            order.amount_total = order.amount_tax + amount_untaxed
            original_total = order.amount_tax + amount_untaxed
            order.amount_total = original_total
            total_credit_amt = 0
            if 'credit_card_charge_amount' in self.env['account.bank.statement.line']._fields:
                credit_charge = 0
                credit_card_charge_value = 0
                for statement_ids in order.statement_ids:
                        if(statement_ids.journal_id.code == 'cc' or statement_ids.journal_id.code == 'CC'):
                            credit_charge = statement_ids.credit_card_charge_amount
                            credit_card_charge_value = currency.round((credit_charge))
                            total_credit_amt+= credit_card_charge_value
                order.credit_card_charges = total_credit_amt
            order.amount_total = original_total+total_credit_amt    

    def _prepare_invoice(self):
        """
        Prepare the dict of values to create the new invoice for a pos order.

        :rtype: dict.

        :return returns the values of the field

        """
        credit_card_charge = 0
        charge = 0
        invoice_type = 'out_invoice' if self.amount_total >= 0 else 'out_refund'
        for statement_ids in self.statement_ids:
            if statement_ids.journal_id.code == 'cc' or statement_ids.journal_id.code == 'CC':
                credit_card_charge += statement_ids.credit_card_charge_amount
                charge = statement_ids.journal_id.default_credit_charge_id.id

        return {
            'name': self.name,
            'origin': self.name,
            'account_id': self.partner_id.property_account_receivable_id.id,
            'journal_id': self.session_id.config_id.invoice_journal_id.id,
            'company_id': self.company_id.id,
            'type': invoice_type,
            'reference': self.name,
            'partner_id': self.partner_id.id,
            'comment': self.note or '',
            # considering partner's sale pricelist's currency
            'currency_id': self.pricelist_id.currency_id.id,
            'user_id': self.user_id.id,
            'card_charge': credit_card_charge,
            'default_credit_charge_id': charge,           
            
        }
        
    @api.model
    def _get_account_move_line_group_data_type_key(self, data_type, values, options={}):
        """
        Return a tuple which will be used as a key for grouping account
        move lines in _create_account_move_line method.
        :param data_type: 'product', 'tax', ....
        :param values: account move line values
        :return: tuple() representing the data_type key
        """
        res = (PosOrder,self)._get_account_move_line_group_data_type_key(data_type, values, options={})
        if not res:
            if data_type == 'cc_charge':
                    key = ('cc_charge', values['partner_id'],
                           values['account_id'], values['debit'] > 0)
        return False
        
    def _create_account_move_line(self, session=None, move=None):
        """Create a account move line of order grouped by products or not.
        :param session: contains session value none

        :param move: contains move as none

        :rtype dict

        :return returns the boolean True"""
        def _flatten_tax_and_children(taxes, group_done=None):
            children = self.env['account.tax']
            if group_done is None:
                group_done = set()
            for tax in taxes.filtered(lambda t: t.amount_type == 'group'):
                if tax.id not in group_done:
                    group_done.add(tax.id)
                    children |= _flatten_tax_and_children(tax.children_tax_ids, group_done)
            return taxes + children

        # Tricky, via the workflow, we only have one id in the ids variable
        """Create a account move line of order grouped by products or not."""
        IrProperty = self.env['ir.property']
        ResPartner = self.env['res.partner']

        if session and not all(session.id == order.session_id.id for order in self):
            raise UserError(_('Selected orders do not have the same session!'))

        grouped_data = {}
        have_to_group_by = session and session.config_id.group_by or False
        rounding_method = session and session.config_id.company_id.tax_calculation_rounding_method

        def add_anglosaxon_lines(grouped_data):
            Product = self.env['product.product']
            Analytic = self.env['account.analytic.account']
            for product_key in list(grouped_data.keys()):
                if product_key[0] == "product":
                    line = grouped_data[product_key][0]
                    product = Product.browse(line['product_id'])
                    # In the SO part, the entries will be inverted by function compute_invoice_totals
                    price_unit = self._get_pos_anglo_saxon_price_unit(product, line['partner_id'], line['quantity'])
                    account_analytic = Analytic.browse(line.get('analytic_account_id'))
                    res = Product._anglo_saxon_sale_move_lines(
                        line['name'], product, product.uom_id, line['quantity'], price_unit,
                            fiscal_position=order.fiscal_position_id,
                            account_analytic=account_analytic)
                    if res:
                        line1, line2 = res
                        line1 = Product._convert_prepared_anglosaxon_line(line1, order.partner_id)
                        insert_data('counter_part', {
                            'name': line1['name'],
                            'account_id': line1['account_id'],
                            'credit': line1['credit'] or 0.0,
                            'debit': line1['debit'] or 0.0,
                            'partner_id': line1['partner_id']

                        })

                        line2 = Product._convert_prepared_anglosaxon_line(line2, order.partner_id)
                        insert_data('counter_part', {
                            'name': line2['name'],
                            'account_id': line2['account_id'],
                            'credit': line2['credit'] or 0.0,
                            'debit': line2['debit'] or 0.0,
                            'partner_id': line2['partner_id']
                        })

        for order in self.filtered(lambda o: not o.account_move or o.state == 'paid'):
            current_company = order.sale_journal.company_id
            account_def = IrProperty.get(
                'property_account_receivable_id', 'res.partner')
            order_account = order.partner_id.property_account_receivable_id.id or account_def and account_def.id
            partner_id = ResPartner._find_accounting_partner(order.partner_id).id or False
            if move is None:
                # Create an entry for the sale
                journal_id = self.env['ir.config_parameter'].sudo().get_param(
                    'pos.closing.journal_id_%s' % current_company.id, default=order.sale_journal.id)
                move = self._create_account_move(
                    order.session_id.start_at, order.name, int(journal_id), order.company_id.id)

            def insert_data(data_type, values):
                # if have_to_group_by:
                values.update({
                    'partner_id': partner_id,
                    'move_id': move.id,
                })
                
                key = self._get_account_move_line_group_data_type_key(data_type, values, {'rounding_method': rounding_method})
                if not key:
                    return

                grouped_data.setdefault(key, [])

                if have_to_group_by:
                    if not grouped_data[key]:
                        grouped_data[key].append(values)
                    else:
                        current_value = grouped_data[key][0]
                        current_value['quantity'] = current_value.get('quantity', 0.0) + values.get('quantity', 0.0)
                        current_value['credit'] = current_value.get('credit', 0.0) + values.get('credit', 0.0)
                        current_value['debit'] = current_value.get('debit', 0.0) + values.get('debit', 0.0)
                        if key[0] == 'tax' and rounding_method == 'round_globally':
                            if current_value['debit'] - current_value['credit'] > 0:
                                current_value['debit'] = current_value['debit'] - current_value['credit']
                                current_value['credit'] = 0
                            else:
                                current_value['credit'] = current_value['credit'] - current_value['debit']
                                current_value['debit'] = 0

                else:
                    grouped_data[key].append(values)

            # because of the weird way the pos order is written, we need to make sure there is at least one line,
            # because just after the 'for' loop there are references to 'line' and 'income_account' variables (that
            # are set inside the for loop)
            # TOFIX: a deep refactoring of this method (and class!) is needed
            # in order to get rid of this stupid hack
            assert order.lines, _('The POS order must have lines when calling this method')
            # Create an move for each order line
            cur = order.pricelist_id.currency_id
            for line in order.lines:
                amount = line.price_subtotal

                # Search for the income account
                if line.product_id.property_account_income_id.id:
                    income_account = line.product_id.property_account_income_id.id
                elif line.product_id.categ_id.property_account_income_categ_id.id:
                    income_account = line.product_id.categ_id.property_account_income_categ_id.id
                else:
                    raise UserError(_('Please define income '
                                      'account for this product: "%s" (id:%d).')
                                    % (line.product_id.name, line.product_id.id))

                name = line.product_id.name
                if line.notice:
                    # add discount reason in move
                    name = name + ' (' + line.notice + ')'

                # Create a move for the line for the order line
                # Just like for invoices, a group of taxes must be present on this base line
                # As well as its children
                base_line_tax_ids = _flatten_tax_and_children(line.tax_ids_after_fiscal_position).filtered(lambda tax: tax.type_tax_use in ['sale', 'none'])
                insert_data('product', {
                    'name': name,
                    'quantity': line.qty,
                    'product_id': line.product_id.id,
                    'account_id': income_account,
                    'analytic_account_id': self._prepare_analytic_account(line),
                    'credit': ((amount > 0) and amount) or 0.0,
                    'debit': ((amount < 0) and -amount) or 0.0,
                    'tax_ids': [(6, 0, base_line_tax_ids.ids)],
                    'partner_id': partner_id
                })

                # Create the tax lines
                taxes = line.tax_ids_after_fiscal_position.filtered(lambda t: t.company_id.id == current_company.id)
                if not taxes:
                    continue
                price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
                for tax in taxes.compute_all(price, cur, line.qty)['taxes']:
                    insert_data('tax', {
                        'name': _('Tax') + ' ' + tax['name'],
                        'product_id': line.product_id.id,
                        'quantity': line.qty,
                        'account_id': tax['account_id'] or income_account,
                        'credit': ((tax['amount'] > 0) and tax['amount']) or 0.0,
                        'debit': ((tax['amount'] < 0) and -tax['amount']) or 0.0,
                        'tax_line_id': tax['id'],
                        'partner_id': partner_id,
                        'order_id': order.id
                    })
            # create credit card charge
            card_charge = 0
            credit_amt = 0
            for statement_id in order.statement_ids:
                if statement_id.journal_id.code == 'cc' or statement_id.journal_id.code == 'CC':
                    account_id = statement_id.journal_id.default_credit_charge_id.id
                    card_charge = statement_id.journal_id.credit_card_charge
                    credit_amt += statement_id.credit_card_charge_amount
    
            if card_charge > 0:
                credit_card_charge = credit_amt
                insert_data('cc_charge', {
                        'name': 'Credit Card Charges',
                        'account_id': account_id,
                        'credit': credit_card_charge,
                        'debit': 0.0,
                        'partner_id': partner_id
                })

            # round tax lines per order
            if rounding_method == 'round_globally':
                for group_key, group_value in grouped_data.items():
                    if group_key[0] == 'tax':
                        for line in group_value:
                            line['credit'] = cur.round(line['credit'])
                            line['debit'] = cur.round(line['debit'])

            # counterpart
            insert_data('counter_part', {
                'name': _("Trade Receivables"),  # order.name,
                'account_id': order_account,
                'credit': ((order.amount_total < 0) and -order.amount_total) or 0.0,
                'debit': ((order.amount_total > 0) and order.amount_total) or 0.0,
                'partner_id': partner_id
            })

            order.write({'state': 'done', 'account_move': move.id})

        if self and order.company_id.anglo_saxon_accounting:
            add_anglosaxon_lines(grouped_data)

        all_lines = []
        for group_key, group_data in grouped_data.items():
            for value in group_data:
                all_lines.append((0, 0, value),)
        if move:  # In case no order was changed
            move.sudo().write({'line_ids': all_lines})
            move.sudo().post()
        return True



    @api.model
    def _payment_fields(self, ui_paymentline):
        fields = super(PosOrder, self)._payment_fields(ui_paymentline)

        fields.update({
            'credit_card_charge_amount':  ui_paymentline.get('credit_card_charge_amount'),
        })

        return fields

    def add_payment(self, data):
        statement_id = super(PosOrder, self).add_payment(data)
        paid_amount =  format(data['amount'], '.2f')
        statement_lines = self.env['account.bank.statement.line'].search([('statement_id', '=', statement_id),
                                                                         ('pos_statement_id', '=', self.id),
                                                                         ('journal_id', '=', data['journal']),
                                                                         ('amount', '=', paid_amount)])

        for line in statement_lines:
            if data.get('credit_card_charge_amount'):
                line.credit_card_charge_amount = data.get('credit_card_charge_amount')
        return statement_id


class AccountInvoice(models.Model):
    _inherit = "account.invoice"
    _description = "Invoice"

    card_charge = fields.Float(string="Card Charge")
    default_credit_charge_id = fields.Integer(string="Credit charge id")
    credit_card_charges = fields.Monetary(string="Credit Card Charges",
                                          compute='_compute_amount',
                                          store=True)

    @api.one
    @api.depends('invoice_line_ids.price_subtotal', 'tax_line_ids.amount',
                 'currency_id', 'company_id', 'date_invoice', 'type')
    def _compute_amount(self):
        super(AccountInvoice, self)._compute_amount()
        round_curr = self.currency_id.round
        self.amount_untaxed = sum(line.price_subtotal for line in self.invoice_line_ids)
        self.amount_tax = sum(round_curr(line.amount) for line in self.tax_line_ids)
        pos_order = self.env['pos.order'].search(
                        [('invoice_id', '=', self.id)])
        credit_charge = 0
        if pos_order  and 'credit_card_charge_amount' in self.env['account.bank.statement.line']._fields:
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
            currency_id = self.currency_id.with_context(date=self.date_invoice)
            amount_total_company_signed = currency_id.compute(self.amount_total, self.company_id.currency_id)
            amount_untaxed_signed = currency_id.compute(self.amount_untaxed, self.company_id.currency_id)
        sign = self.type in ['in_refund', 'out_refund'] and -1 or 1
        self.amount_total_company_signed = amount_total_company_signed * sign
        self.amount_total_signed = self.amount_total * sign
        self.amount_untaxed_signed = amount_untaxed_signed * sign


    @api.multi
    def action_move_create(self):
        """ Creates invoice related analytics and financial move lines

        :rtype dict

        """
        account_move = self.env['account.move']

        for inv in self:
            if not inv.journal_id.sequence_id:
                raise UserError(_('Please define sequence on the journal '
                                  'related to this invoice.'))
            if not inv.invoice_line_ids:
                raise UserError(_('Please create some invoice lines.'))
            if inv.move_id:
                continue

            ctx = dict(self._context, lang=inv.partner_id.lang)

            if not inv.date_invoice:
                inv.with_context(ctx).write(
                    {'date_invoice': fields.Date.context_today(self)})
            date_invoice = inv.date_invoice
            company_currency = inv.company_id.currency_id

            # create move lines (one per invoice line +
            # eventual taxes and analytic lines)
            iml = inv.invoice_line_move_line_get()
            iml += inv.tax_line_move_line_get()
            if (self.default_credit_charge_id):
                iml += inv.credit_card_move_line_get()

            diff_currency = inv.currency_id != company_currency
            # create one move line for the total and
            # possibly adjust the other lines amount
            total, total_currency, iml = inv.with_context(ctx).compute_invoice_totals(company_currency, iml)

            name = inv.name or '/'
            if inv.payment_term_id:
                totlines = inv.with_context(ctx).payment_term_id.with_context(
                    currency_id=inv.currency_id.id).compute(
                        total, date_invoice)[0]
                res_amount_currency = total_currency
                ctx['date'] = date_invoice
                for i, t in enumerate(totlines):
                    if inv.currency_id != company_currency:
                        amount_currency = company_currency.with_context(ctx).compute(t[1], inv.currency_id)
                    else:
                        amount_currency = False

                    # last line: add the diff
                    res_amount_currency -= amount_currency or 0
                    if i + 1 == len(totlines):
                        amount_currency += res_amount_currency

                    iml.append({
                        'type': 'dest',
                        'name': name,
                        'price': t[1],
                        'account_id': inv.account_id.id,
                        'date_maturity': t[0],
                        'amount_currency': diff_currency and amount_currency,
                        'currency_id': diff_currency and inv.currency_id.id,
                        'invoice_id': inv.id
                    })
            else:
                iml.append({
                    'type': 'dest',
                    'name': name,
                    'price': total,
                    'account_id': inv.account_id.id,
                    'date_maturity': inv.date_due,
                    'amount_currency': diff_currency and total_currency,
                    'currency_id': diff_currency and inv.currency_id.id,
                    'invoice_id': inv.id
                })
            part = self.env['res.partner']._find_accounting_partner(
                inv.partner_id)
            line = [(0, 0, self.line_get_convert(l, part.id)) for l in iml]
            line = inv.group_lines(iml, line)

            journal = inv.journal_id.with_context(ctx)
            line = inv.finalize_invoice_move_lines(line)

            date = inv.date or date_invoice
            move_vals = {
                'ref': inv.reference,
                'line_ids': line,
                'journal_id': journal.id,
                'date': date,
                'narration': inv.comment,
            }
            ctx['company_id'] = inv.company_id.id
            ctx['invoice'] = inv
            ctx_nolang = ctx.copy()
            ctx_nolang.pop('lang', None)
            move = account_move.with_context(ctx_nolang).create(move_vals)
            # Pass invoice in context in method post: used
            # if you want to get the same
            # account move reference when creating the same
            # invoice after a cancelled one:
            move.post()
            # make the invoice point to that move
            vals = {
                'move_id': move.id,
                'date': date,
                'move_name': move.name,
            }
            inv.with_context(ctx).write(vals)
        return True

    @api.model
    def credit_card_move_line_get(self):
        """Post credit card charge value in

        Journal entry

        :rtype dict

        :return returns the credit card value with other journal entries

        """
        card_value = self.default_credit_charge_id
        # card_charge = self.card_charge
        amount_untaxed = self.amount_untaxed
        total_with_credit = self.amount_total
        tax_amount = self.amount_tax
        total = amount_untaxed + tax_amount
        credit_card_value = total_with_credit - total
        res = []
        res.append({
            'type': 'src',
            'name': 'Credit Card Charge',
            'quantity': 1,
            'price': credit_card_value,
            'account_id': card_value
                })
        return res
