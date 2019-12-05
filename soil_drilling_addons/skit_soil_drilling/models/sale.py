# -*- coding: utf-8 -*-
from odoo import api, models, fields,_
from odoo.addons import decimal_precision as dp


class SaleOrder(models.Model):
    _inherit = "sale.order"
    
    journal_id = fields.Many2one('account.journal',"Payment Mode")
    sale_type = fields.Selection([
                                ('laboratory', _('Laboratory')),
                                ('soil drilling', _('Soil Drilling'))], string='Sale Type',default='laboratory')
    branch = fields.Char("Branch")
    isassociate_project = fields.Boolean('Associated to a Project', default=False)
    no_of_boreholes = fields.Integer("No.of Boreholes", default=1)
    depth = fields.Float("Depth", digits=dp.get_precision('Product Price'))
    intervals = fields.Float("Interval", digits=dp.get_precision('Product Price'))
    scope_note = fields.Text("Scope of Work")
    task_no_id = fields.One2many('sale.order.line', 'order_id',"Task numbers", states={'cancel': [('readonly', True)], 'done': [('readonly', True)]}, copy=True, auto_join=True)

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
    
class SaleOrderLine(models.Model):
    _inherit="sale.order.line"
     
    date=fields.Date(string="Date")
    task_no=fields.Integer(string="Task number")
    task_name=fields.Char(string="Task Name")
    test_desired=fields.Selection([
        ('lab','Laboratory Options'),
        ('soil','Soil Drilling')],'Test Desired',required="True")
    section=fields.Selection([
        ('concrete','Concrete'),
        ('steel','Steel'),
        ('chemical','Chemical'),
        ('soil','Soil')],'Section',required="True")  
    lab_no = fields.Char(string="Lab No.", readonly=True, required=True, copy=False) 
    @api.onchange('sequence')
    def _onchange_date(self):
        seq_no =self.env['ir.sequence'].next_by_code('sale.order.line') 
        brch = self.order_id.branch
        self.lab_no=seq_no
        
        
    
    
    
    
    
     