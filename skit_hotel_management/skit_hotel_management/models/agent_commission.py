# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api


class AgentCommissionInvoice(models.Model):

    _name = "hm.agent.commission.invoice"
    _description = "Agent Commission Invoice"

    @api.depends('agent_line_ids.commission_amount')
    def _amount_all(self):
        """
        Compute the commission_amount of Orders.
        """
        for order in self:
            total_commission_amount = 0.0
            for line in order.agent_line_ids:
                total_commission_amount += line.commission_amount
            order.update({
                'commission_amount': total_commission_amount,
            })

    name = fields.Char('Agent Commission No.')
    create_date = fields.Datetime(string="Date")
    agent_id = fields.Many2one('res.partner', required=True,
                               domain=[('supplier', '=', True)],
                               string="Agent Name")
    state = fields.Selection([('draft', 'Draft'),
                              ('confirmed', 'Confirmed'),
                              ('invoiced', 'Invoiced'),
                              ('done', 'Done')],
                             'Status', default='draft')
    agent_line_ids = fields.One2many('hm.agent.commission.invoice.line',
                                     'agent_id', required=True,
                                     string='Agent Commission Invoice Line',
                                     copy=True)
    commission_amount = fields.Float(string='Commission Amount', readonly=True,
                                     digits=(16, 2), compute='_amount_all')
    agent_invoice_ids = fields.Many2many('account.invoice', readonly=True,
                                         string="invoice")
    invoice_ids_count = fields.Integer(compute='_compute_invoice_ids_count',
                                       string='# of Invoices')

    @api.depends('agent_invoice_ids')
    def _compute_invoice_ids_count(self):
        """ Compute method for Invoice Count"""
        for ac_invoice in self:
            ac_invoice.invoice_ids_count = len(ac_invoice.agent_invoice_ids)

    @api.multi
    def action_view_invoice(self):
        """ Vendor Bill action view """
        invoices = self.mapped('agent_invoice_ids')
        action = self.env.ref('account.action_vendor_bill_template').read()[0]
        if len(invoices) > 1:
            action['domain'] = [('id', 'in', invoices.ids)]
        elif len(invoices) == 1:
            action['views'] = [(self.env.ref('account.invoice_supplier_form').id, 'form')]
            action['res_id'] = invoices.ids[0]
        else:
            action = {'type': 'ir.actions.act_window_close'}
        return action

    @api.model
    def update_commission_line(self, agent_id):
        """ Create commission line for agent commission invoice"""
        if agent_id:
            order_ids = self.env['pos.order'].search([
                         ('referred_by_name.agent_name.id', '=', agent_id),
                         ('reservation_status', 'in', ('checkin', 'checkout')),
                         ('is_commissionpaid', '=', False)
                         ])
            commission_line_ids = []
            if order_ids:
                for order in order_ids:
                    commision_type = ''
                    if order.referred_by_name.commission:
                        commission = order.referred_by_name.commission
                        commision_type = order.referred_by_name.commision_type
                    else:
                        commission = order.referred_by_id.commission
                        commision_type = order.referred_by_id.commision_type
                    if commision_type == 'fixed':
                        commission_amount = commission
                    else:
                        commission_amount = ((order.amount_total * commission)/100)
                    commission_line = self.agent_line_ids.create({
                                        'folio_id': order.id,
                                        'customer_name': order.partner_id.id,
                                        'total_cost': order.amount_total,
                                        'commission': commission,
                                        'commission_amount': commission_amount,
                                        })
                    commission_line_ids.append(commission_line.id)
        return commission_line_ids

    @api.model
    def create(self, vals):
        """ Create agent commission invoice"""
        vals['name'] = self.env['ir.sequence'].next_by_code(
                                        'hm.agent.commission.invoice') or 'New'
        partner = super(AgentCommissionInvoice, self).create(vals)
        commission_line_ids = self.update_commission_line(partner.agent_id.id)
        if commission_line_ids:
            partner.write({'agent_line_ids': [(6, 0,
                                               commission_line_ids)
                                              ],
                           })
        return partner

    @api.multi
    def action_confirm(self):
        """ Confirm button action - create commission line
            @param: agent_id
        """
        self.state = 'confirmed'
        agent_id = self.agent_id
        if not self.agent_line_ids:
            commission_line_ids = self.update_commission_line(agent_id)
            if commission_line_ids:
                self.write({'agent_line_ids': [(6, 0,
                                                commission_line_ids)
                                               ],
                            })
        return

    @api.multi
    def action_create_invoice(self):
        """ Create vendor bill for agent commission invoice"""
        self.state = 'invoiced'
        account_invoice = self.env['account.invoice']
        account_invoice_line = self.env['account.invoice.line']
        journal_id = self.env['account.journal'].search([
                                 ('type', '=', 'purchase'),
                                 ], limit=1)
        invoice_val = {'partner_id': self.agent_id.id,
                       'date_invoice': fields.Date.context_today(self),
                       'reference': 'Commission Invoice',
                       'type': 'in_invoice',
                       'journal_id': journal_id.id,
                       'origin': self.name}
        invoice_created = account_invoice.create(invoice_val)
        invoice_line_val = {
                            'name': self.name,
                            'invoice_id': invoice_created.id,
                            'partner_id': self.agent_id.id,
                            'account_id': journal_id.default_debit_account_id.id,
                            'quantity': 1,
                            'price_unit': self.commission_amount
                            }
        invoice_line_created = account_invoice_line.create(invoice_line_val)
        invoice_created.action_invoice_open()
        inv = []
        if self.agent_invoice_ids:
            inv = self.agent_invoice_ids.ids
            inv.append(invoice_created.id)
            self.write({'agent_invoice_ids': [(6, 0, [inv])]})
        else:
            self.write({'agent_invoice_ids': [(6, 0, [invoice_created.id])]})


class AgentCommissionInvoiceLine(models.Model):

    _name = "hm.agent.commission.invoice.line"
    _description = "Agent Commission Invoice Line"

    agent_id = fields.Many2one('hm.agent.commission.invoice',
                               string="Agent Commission Invoice")
    total_cost = fields.Float(string='Total Cost', required=True,
                              digits=(16, 2))
    commission = fields.Float(string='Commission', required=True,
                              digits=(16, 2))
    commission_amount = fields.Float(string='Commission Amount', required=True,
                                     digits=(16, 2))
    customer_name = fields.Many2one('res.partner', required=True,
                                    string="Customer Name")
    folio_id = fields.Many2one('pos.order', required=True,
                               string="Booking Ref")
