# -*- coding: utf-8 -*-
from odoo import api, models, fields
from odoo.exceptions import UserError
from datetime import datetime
from odoo.addons import decimal_precision as dp
from odoo.tools.translate import html_translate


class SlideLearning(models.Model):

    _inherit = 'slide.slide'
    _description = 'Slide Table'

    quiz_first_attempt_reward = fields.Integer('First attempt')
    quiz_second_attempt_reward = fields.Integer('Second attempt')
    quiz_third_attempt_reward = fields.Integer('Third attempt')
    quiz_fourth_attempt_reward = fields.Integer('Fourth and more attempt')
    quiz_question_ids = fields.One2many('slide.question', 'quiz_question_line_id', string='Questions')
    link_ids = fields.One2many('slide.slide.link', 'link_line_id',string='External URL for this slide')
    public_views = fields.Integer(string='Public')
    comments_count = fields.Integer(string='Comments')


class SlideQuestion(models.Model):
    _name = 'slide.question'

    quiz_question_line_id = fields.Many2one('slide.slide', string='Quiz Question')
    # quiz_question = fields.Char(required=True)
    quiz_question = fields.Html('Question Name', translate=html_translate, sanitize_attributes=False)
    quiz_answer_ids = fields.One2many('slide.answer', 'quiz_answer_line_id', string='Answers')


class SlideAnswer(models.Model):
    _name = 'slide.answer'

    quiz_answer_line_id = fields.Many2one('slide.question',string='Quiz Answer')
    # text_value = fields.Char(string='Answer',required=True)
    text_value = fields.Html('Answer', translate=html_translate, sanitize_attributes=False)
    is_correct = fields.Boolean(string='Is Correct Answer')


class SlideLink(models.Model):
    _name = 'slide.slide.link'

    link_line_id = fields.Many2one('slide.slide',string='Slide')
    link_name = fields.Char(string='Title',required=True)
    link = fields.Char(string='Link',required=True)

