# -*- coding: utf-8 -*-
import pytz
from datetime import timedelta
from odoo import api, fields, models, SUPERUSER_ID, _
from odoo.exceptions import UserError


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
    def action_pos_session_close(self):
            # Close CashBox
            res = super(Skit_PosSession, self).action_pos_session_close()
            session_id = self.id
            account_statement_line = self.env['account.bank.statement.line'].search(
                [('statement_id', 'in', self.statement_ids.ids)]
            )
            for line in account_statement_line:
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


class ReportSaleDetails(models.AbstractModel):
    _inherit = 'report.point_of_sale.report_saledetails'

    @api.multi
    def get_report_values(self, docids, data=None):
        """ Inherited method to update payment details of pay later
            in sales details report"""
        data = super(ReportSaleDetails, self).get_report_values(
                                                            docids, data=data)
        user_tz = pytz.timezone(self.env.context.get('tz') or self.env.user.tz or 'UTC')
        today = user_tz.localize(fields.Datetime.from_string(fields.Date.context_today(self)))
        today = today.astimezone(pytz.timezone('UTC'))
        if data['date_start']:
            date_start = fields.Datetime.from_string(data['date_start'])
        else:
            # start by default today 00:00:00
            date_start = today

        if data['date_stop']:
            # set time to 23:59:59
            date_stop = fields.Datetime.from_string(data['date_stop'])
        else:
            # stop by default today 23:59:59
            date_stop = today + timedelta(days=1, seconds=-1)

        # avoid a date_stop smaller than date_start
        date_stop = max(date_stop, date_start)

        date_start = fields.Datetime.to_string(date_start)
        date_stop = fields.Datetime.to_string(date_stop)
        configs = self.env['pos.config'].browse(data['config_ids'])
        # Get session statment_lines for payment details
        sessions = self.env['pos.session'].search([
                        ('start_at', '>=', date_start),
                        ('stop_at', '<=', date_stop),
                        ('config_id', 'in', configs.ids)])
        statement_ids = self.env["account.bank.statement"].search([
                                    ('pos_session_id', 'in', sessions.ids)])
        st_line_ids = self.env["account.bank.statement.line"].search([
                                ('statement_id', 'in', statement_ids.ids)]).ids
        if st_line_ids:
            self.env.cr.execute("""
                SELECT aj.name, sum(amount) total
                FROM account_bank_statement_line AS absl,
                     account_bank_statement AS abs,
                     account_journal AS aj
                WHERE absl.statement_id = abs.id
                    AND abs.journal_id = aj.id
                    AND absl.id IN %s
                GROUP BY aj.name
            """, (tuple(st_line_ids),))
            payments = self.env.cr.dictfetchall()
        else:
            payments = []
        # modified previous payments
        data['payments'] = payments
        return data


