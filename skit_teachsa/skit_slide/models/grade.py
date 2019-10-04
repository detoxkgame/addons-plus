# -*- coding: utf-8 -*-

from odoo import api, fields, models, _


class Grade(models.Model):
    _name = "grade"

    name = fields.Char(string='Name')
    remark = fields.Text(string="Remark")
