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
        # Change Sales Order document sequence from SO to JO
        res['name'] = vals['name'].replace('SO', 'JO')
        return res
    
    # This initiate the creation of a Project in the Project Module once the Create Project document is clicked.  
    @api.multi
    def project_document(self):
        return {
            'name': _('Project from Sales'),
            'view_type': 'form',
            'view_mode': 'form',
            'type': 'ir.actions.act_window',
            'res_model': 'project.project',
            'view_id': self.env.ref('project.edit_project').ids,
            'target': 'new',
        }
    
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