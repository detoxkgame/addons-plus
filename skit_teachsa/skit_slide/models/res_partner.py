# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class Partner(models.Model):
    _inherit = "res.partner"

    issponsor = fields.Boolean(string='IsSponsor', default=False)
    istutor = fields.Boolean(string='IsTutor', default=False)
