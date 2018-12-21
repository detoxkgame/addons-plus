# -*- coding: utf-8 -*-

from odoo import fields, models


class KPICategory(models.Model):
    """KPI Category."""

    _name = "kpi.category"
    _description = "KPI Category"

    name = fields.Char('Name', size=50, required=True)
    description = fields.Text('Description')
