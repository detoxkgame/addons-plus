# -*- coding: utf-8 -*-
from odoo import models, fields


class PosConfig(models.Model):
    _inherit = "pos.config"

    print_paper_size = fields.Selection([('58mm', "58mm"),
                                        ('80mm', "80mm")], default=False,
                                        help="Receipt print paper form.")
