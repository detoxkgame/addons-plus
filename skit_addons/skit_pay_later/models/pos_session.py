from odoo import api, models, SUPERUSER_ID, _
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

