# -*- coding: utf-8 -*-
from odoo import models, fields


class Slide(models.Model):
    _inherit = 'slide.slide'

    slide_type = fields.Selection([
        ('quiz', 'Quiz'),
        ('presentation', 'Presentation'),
        ('document', 'Document'),
        ('video', 'Video')],
        string='Type', required=True,
        default='document',
        help="The document type will be set automatically based on the document URL and properties(e.g. height and width for presentation and document).")
    user_id = fields.Many2one('res.users', string="Uploaded by")
    completion_time = fields.Float("Duration")
    is_preview = fields.Boolean(string="Allow preview")
#     data = fields.Binary('File')
    sequence = fields.Integer(default=10, help='Display order')
