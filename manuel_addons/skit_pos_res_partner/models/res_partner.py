# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import fields, models

class Partner(models.Model):
    _inherit = "res.partner"
    
    age = fields.Integer(string='Age')
    sex = fields.Char(string='Sex')
    