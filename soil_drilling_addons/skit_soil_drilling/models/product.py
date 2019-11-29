from odoo import models, fields, api

class product(models.Model):
   
    _inherit = "product.template"
 
    lab_work = fields.Boolean('Lab Work' ,default=False)
    soil_test_type = fields.Selection([
        ('lab','Laboratory Options'),
        ('soil','Soil Drilling')],'Test Type')
    soil_test_type1 = fields.Selection([
        ('quality_test', 'Quality Test'), 
        ('selective_test', 'Selective test')],'Test Type')
