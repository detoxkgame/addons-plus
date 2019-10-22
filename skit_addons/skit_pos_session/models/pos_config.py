# -*- coding: utf-8 -*-

from odoo import fields, models


class POSConfig(models.Model):
    _inherit = 'pos.config'

    mail_users = fields.Many2many('res.users', string='Mail Users')
