# -*- coding: utf-8 -*-
from odoo import api, models, fields,_


class SaleOrder(models.Model):
    _inherit = "sale.order"
    
    journal_id = fields.Many2one('account.journal',"Payment Mode")
    sale_type = fields.Selection([
                                ('laboratory', _('Laboratory')),
                                ('soil drilling', _('Soil Drilling'))], string='Sale Type',default='laboratory')
    branch = fields.Char("Branch")
    isassociate_project = fields.Boolean('Associated to a Project', default=False)
    
    @api.model
    def create(self, vals):
        res = super(SaleOrder, self).create(vals)
        res['name'] = vals['name'].replace('SO', 'JO')
        return res
    
class sale_order_line(models.Model):
    _inherit="sale.order.line"
    
    date = fields.Date(string="Date")
    test_desired=fields.Selection([
        ('lab','Laboratory Options'),
        ('soil','Soil Drilling')],'Test Desired',required="True")
    section=fields.Selection([
        ('concrete','Concrete'),
        ('steel','Steel'),
        ('chemical','Chemical'),
        ('soil','Soil')],'Section',required="True")    