# -*- coding: utf-8 -*-
from odoo import models, fields


class Channel(models.Model):
    _inherit = 'slide.channel'

    nbr_presentation = fields.Integer('Presentations', readonly=True)
    nbr_document = fields.Integer('Documents', readonly=True)
    nbr_video = fields.Integer('Videos', readonly=True)
    nbr_quizzes = fields.Integer('Quizzes', readonly=True)
    total_views = fields.Integer('Visits', readonly=True)
    total_time = fields.Float('Watch Time', readonly=True)
    rating_avg = fields.Float('Rating', readonly=True)
