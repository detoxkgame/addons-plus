# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class PosConfig(models.Model):
    _inherit = "pos.config"
    is_walkin = fields.Boolean("Walk-in Customer")

class ResPartner(models.Model):
    _inherit = "res.partner"
    is_walkin = fields.Boolean("Walk-in Customer")
                
    @api.multi
    def write(self, vals):
        if vals.get('is_walkin') is True:
            partner = self.env['res.partner'].search([('is_walkin', '=', True)])
            if  partner:
                raise UserError(_(" Walk-in Customer cannot be more than one."))
        res = super(ResPartner, self).write(vals)
        return res
    
    @api.multi
    def get_walkincustomer(self):
        partner = self.env['res.partner'].search([('is_walkin', '=', True)])
        walkin_customer = partner.id
        return walkin_customer
    