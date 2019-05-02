from odoo import api, fields, models, SUPERUSER_ID, _
from odoo.exceptions import UserError
from datetime import datetime, timedelta
from odoo.tools import float_is_zero


class Skit_PosSession(models.Model):
    _inherit = 'pos.session'

    def _confirm_paylater_orders(self, pay_later_order):
            """ Posting method for Pay later order while close session
            :param pay_later_order:order
             """
            for session in self:
                pay_order = pay_later_order.filtered(
                            lambda order: order.state in ['invoiced', 'done'])
                pay_order.sudo()._reconcile_payments()

    @api.multi
    def action_pos_session_closing_control(self):
        self._check_pos_session_balance()
        for session in self:
            porder = self.env['pos.order'].search([
                            ('is_service_order', '=', True),
                            ('session_id', '=', session.id)])
            for order in porder:
                current_date = (datetime.today()).strftime('%Y-%m-%d %H:%M:%S')
                prec_acc = order.pricelist_id.currency_id.decimal_places
                account_journal = self.env['account.journal'].sudo().search([
                                                    ('is_pay_later', '=', True)],
                                                                limit=1)
                account_statement = self.env['account.bank.statement'].sudo().search(
                                                [('pos_session_id', '=', order.session_id.id),
                                                 ('journal_id', '=', account_journal.id)])
                if(order.invoice_id):
                    paid_amount = sum([x.amount for x in order.statement_ids])
                    invoice_amount = order.invoice_id.amount_total - paid_amount
                    if not float_is_zero(invoice_amount, precision_digits=prec_acc):
                        order.add_payment(self._payment_fields({'name': current_date, 
                                                                'partner_id': order.partner_id.id,
                                                                'statement_id': account_statement.id, 
                                                                'account_id': account_journal.default_debit_account_id, 
                                                                'journal_id': account_journal.id, 
                                                                'amount': invoice_amount}))
                else:
                    journal_ids = set()
                    order.action_pos_order_invoice()
                    order.invoice_id.sudo().action_invoice_open()
                    order.account_move = order.invoice_id.move_id
                    if not float_is_zero(order.invoice_id.residual, precision_digits=prec_acc):
                        order.add_payment(order._payment_fields({'name': current_date, 
                                                                 'partner_id': order.partner_id.id,
                                                                 'statement_id': account_statement.id, 
                                                                 'account_id': account_journal.default_debit_account_id, 
                                                                 'journal_id': account_journal.id, 
                                                                 'amount': order.invoice_id.residual}))
                    journal_ids.add(account_journal.id)
            session.write({'state': 'closing_control', 'stop_at': fields.Datetime.now()})
            if not session.config_id.cash_control:
                session.action_pos_session_close()

    @api.multi
    def action_pos_session_close(self):
            # Close CashBox
            res = super(Skit_PosSession, self).action_pos_session_close()
            session_id = self.id
            account_statement_line = self.env['account.bank.statement.line'].search(
                [('statement_id', 'in', self.statement_ids.ids)]
            )
            for line in account_statement_line:
                """ Update Service Order Status for HM """
                porder = self.env['pos.order'].search([
                            ('id', '=', int(line.pos_statement_id.id)),
                            ('session_id', '=', session_id)])
                if porder.is_service_order:
                    porder.update({'service_status': 'close'})
                if line.pos_statement_id.session_id.id != session_id:
                    pay_later_order = self.env['pos.order'].search([
                            ('id', '=', int(line.pos_statement_id.id)),
                            ('session_id', '!=', session_id)])
                    self._confirm_paylater_orders(pay_later_order)
            return res

    @api.model
    def create(self, values):
        res = super(Skit_PosSession, self).create(values)
        statements = []
        ctx = dict(self.env.context, company_id=res.config_id.company_id.id)
        ABS = self.env['account.bank.statement']
        uid = SUPERUSER_ID if self.env.user.has_group('point_of_sale.group_pos_user') else self.env.user.id
        journal_ids = self.env['account.journal'].search([('id','in',res.config_id.journal_ids.ids), ('is_pay_later', '=', True)])
        for journal in journal_ids:
            # set the journal_id which should be used by
            # account.bank.statement to set the opening balance of the
            # newly created bank statement
            ctx['journal_id'] = journal.id if res.config_id.cash_control and journal.type == 'cash' else False
            st_values = {
                'journal_id': journal.id,
                'user_id': self.env.user.id,
                'name': res.name
            }

            statements.append(ABS.with_context(ctx).sudo(uid).create(st_values).id)
        journal_ids = self.env['account.journal'].search([('id','in',res.config_id.journal_ids.ids), ('is_pay_later', '=', False)])
        for journal in journal_ids:
            # set the journal_id which should be used by
            # account.bank.statement to set the opening balance of the
            # newly created bank statement
            ctx['journal_id'] = journal.id if res.config_id.cash_control and journal.type == 'cash' else False
            st_values = {
                'journal_id': journal.id,
                'user_id': self.env.user.id,
                'name': res.name
            }

            statements.append(ABS.with_context(ctx).sudo(uid).create(st_values).id)

        values.update({
            'statement_ids': [(6, 0, statements)],
        })
        res.write(values)

        return res

