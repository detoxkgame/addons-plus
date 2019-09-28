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
        help="The document type will be set automatically based on the document URL and properties (e.g. height and width for presentation and document).")
    channel_id = fields.Many2one('slide.channel', string="Course", required=True)
    user_id = fields.Many2one('res.users', string="Uploaded by")
    url = fields.Char('Document URL', help="Youtube or Google Document URL")
    completion_time = fields.Float("Duration")