# -*- coding: utf-8 -*-
from odoo import models, fields
from odoo.http import request

class Website(models.Model):

    _inherit = "website"
    
    def get_partner(self):
        details = request.env['res.partner'].sudo().search([('issponsor', '=', 'true')])
        return details