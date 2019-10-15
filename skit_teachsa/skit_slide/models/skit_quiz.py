# -*- coding: utf-8 -*-
from odoo import api, models, fields
from odoo.exceptions import UserError
from datetime import datetime
# from odoo.addons import decimal_precision as dp
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

    quiz_question_line_id = fields.Many2one('slide.slide',
                                            string='Quiz Question')
    # quiz_question = fields.Char(required=True)
    quiz_question = fields.Html('Question Name', translate=html_translate,
                                sanitize_attributes=False)
    answer_type = fields.Selection([('Single','Single Select'),
                                    ('Multi','Multi Select'),
                                    ('Boolean', 'Boolean')],
                                     string="Answer Type")
    question_number = fields.Integer(string='Question Number', compute='_compute_question_number')
    num_correct = fields.Integer(string="Correct Options", compute="calc_correct")

    @api.depends('question_number')
    def _compute_question_number(self):
        for slide in self:
            rest_of_vals = slide - self
            no_of_lines = len(rest_of_vals)
            self.question_number = no_of_lines

    quiz_answer_ids = fields.One2many('slide.answer', 'quiz_answer_line_id',
                                      string='Answers')

    @api.one
    @api.depends('quiz_answer_ids')
    def calc_correct(self):
        self.num_correct = self.quiz_answer_ids.sudo().search_count([
            ('quiz_answer_line_id', '=', self.id),
            ('is_correct', '=', True)])


class SlideAnswer(models.Model):
    _name = 'slide.answer'

    quiz_answer_line_id = fields.Many2one('slide.question', string='Quiz Answer')
    # text_value = fields.Char(string='Answer',required=True)
    text_value = fields.Html('Answer', translate=html_translate, sanitize_attributes=False)
    is_correct = fields.Boolean(string='Is Correct Answer')


class SlideLink(models.Model):
    _name = 'slide.slide.link'

    link_line_id = fields.Many2one('slide.slide', string='Slide')
    link_name = fields.Char(string='Title', required=True)
    link = fields.Char(string='Link', required=True)


class QuizLog(models.Model):
    _name = 'quiz.log'

    question_id = fields.Many2one('slide.question', string='Question')
    answer_id = fields.Many2many('slide.answer', string='Answer')
    status = fields.Selection([('correct', 'Correct'), ('wrong', 'Wrong')],
                              string='Status', required=True,
                              readonly=True, copy=False)
    partner_id = fields.Many2one('res.partner', string='Partner')
    content_subscribed_id = fields.Many2one('slide.content.subscribed',
                                            string='Content Subscribed')


class TutorRemarks(models.Model):
    _name = 'tutor.remarks'

    partner_id = fields.Many2one('res.partner', string='Partner')
    student_remarks = fields.Text("Student Remarks")
    rating = fields.Integer("Ratings")
    parent_remarks = fields.Text("Parent Remarks")
    channel_partner_id = fields.Many2one('slide.channel.partner',
                                         domain="[('istutor', '=',  True)]",
                                         string='Attendees')
