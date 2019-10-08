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


class ContentSubscribed(models.Model):
    _name = 'slide.content.subscribed'
    _description = "Content Subscribed"

    duration = fields.Float('Duration')
    view_datetime = fields.Datetime(string="View Date")
    res_partner_id = fields.Many2one('res.partner', string='Partner',
                                     domain="[('isstudent', '=',  True)]")
    content_id = fields.Many2one('slide.slide',
                                 string='Content')
    quiz_log_ids = fields.One2many('quiz.log',
                                   'content_subscribed_id',
                                   string='Quiz Log')
