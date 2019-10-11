# -*- coding: utf-8 -*-

import base64
import logging
import werkzeug

from odoo import http, _
from odoo.exceptions import AccessError, UserError
from odoo.http import request
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.website.models.ir_http import sitemap_qs2dom

_logger = logging.getLogger(__name__)


class WebsiteGrade(http.Controller):

    @http.route('/grades-subjects/', type='http', auth='public', website=True, sitemap=False)
    def grade(self, **kw):
        grades = request.env['product.category'].sudo().search([('is_grade', '=', True)])
        values = {'grades': grades}
        return request.render('skit_slide.website_elearning_grade', values)

    @http.route(['/grades-subjects/content'], type='json', auth="public", methods=['POST'], website=True)
    def grade_subjects(self, **kw):
        channels = []
        breadcrumbs = []
        slide_slide = request.env['slide.slide']
        breadcrumbs.append('Grade')
        if(kw.get('categ_id')):
            prod_categ = request.env['product.category'].sudo().search([
                ('id', '=', kw.get('categ_id'))])
            channels = request.env['slide.channel'].sudo().search([
                ('product_categ_id', '=', prod_categ.id)])
            breadcrumbs.append(prod_categ.name)
        values = {'channels': channels,
                  'breadcrumbs': breadcrumbs,
                  'slide_slide': slide_slide}
        return request.env['ir.ui.view'].render_template("skit_slide.website_elearning_grade_subjects", values)

    @http.route(['/grades-subjects/topics'], type='json', auth="public", methods=['POST'], website=True)
    def subject_topics(self, **kw):
        channels = []
        contents = []
        breadcrumbs = []
        breadcrumbs.append('Grade')
        if(kw.get('channel_id')):
            channels = request.env['slide.channel'].sudo().search([
                ('id', '=', kw.get('channel_id'))])
            breadcrumbs.append(channels.product_categ_id.name)
            if channels:
                breadcrumbs.append(channels[0].name)
            slides = request.env['slide.slide'].sudo().search([
                ('channel_id', '=', channels.id),
                ('is_preview', '=', True),
                ('display_type', '=', 'line_section')], order='sequence')
            i = 1
            slide_size = len(slides)
            for slide in slides:
                slide_content = []
                next_slide = i + 1
                if(next_slide <= slide_size):
                    next_slide_seq = slides[i].sequence
                    document_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('sequence', '<', next_slide_seq),
                        ('slide_type', '=', 'document')])
                    documents = {}
                    documents['name'] = 'Documents'
                    documents['count'] = len(document_content)
                    documents['slide_type'] = 'document'
                    documents['datas'] = document_content
                    slide_content.append(documents)

                    presentation_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('sequence', '<', next_slide_seq),
                        ('slide_type', '=', 'presentation')])
                    documents = {}
                    documents['name'] = 'Presentations'
                    documents['count'] = len(presentation_content)
                    documents['slide_type'] = 'presentation'
                    documents['datas'] = presentation_content
                    slide_content.append(documents)

                    video_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('sequence', '<', next_slide_seq),
                        ('slide_type', '=', 'video')])
                    documents = {}
                    documents['name'] = 'Videos'
                    documents['count'] = len(video_content)
                    documents['slide_type'] = 'video'
                    documents['datas'] = video_content
                    slide_content.append(documents)

                    quiz_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('sequence', '<', next_slide_seq),
                        ('slide_type', '=', 'quiz')])
                    documents = {}
                    documents['name'] = 'Quiz'
                    documents['count'] = len(quiz_content)
                    documents['slide_type'] = 'quiz'
                    documents['datas'] = quiz_content
                    slide_content.append(documents)

                    contents.append({'slide'+str(slide.id): slide_content})
                else:
                    document_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('slide_type', '=', 'document')])
                    documents = {}
                    documents['name'] = 'Documents'
                    documents['count'] = len(document_content)
                    documents['slide_type'] = 'document'
                    documents['datas'] = document_content
                    slide_content.append(documents)

                    presentation_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('slide_type', '=', 'presentation')])
                    documents = {}
                    documents['name'] = 'Presentations'
                    documents['count'] = len(presentation_content)
                    documents['slide_type'] = 'presentation'
                    documents['datas'] = presentation_content
                    slide_content.append(documents)

                    video_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('slide_type', '=', 'video')])
                    documents = {}
                    documents['name'] = 'Videos'
                    documents['count'] = len(video_content)
                    documents['slide_type'] = 'video'
                    documents['datas'] = video_content
                    slide_content.append(documents)

                    quiz_content = request.env['slide.slide'].sudo().search([
                        ('channel_id', '=', channels.id),
                        ('is_preview', '=', True),
                        ('sequence', '>', slide.sequence),
                        ('slide_type', '=', 'quiz')])
                    documents = {}
                    documents['name'] = 'Quiz'
                    documents['count'] = len(quiz_content)
                    documents['slide_type'] = 'quiz'
                    documents['datas'] = quiz_content
                    slide_content.append(documents)

                    contents.append({'slide'+str(slide.id): slide_content})
                i = i + 1
        values = {'topics': slides,
                  'breadcrumbs': breadcrumbs,
                  'contents': contents}
        return request.env['ir.ui.view'].render_template("skit_slide.website_grade_subject_topics", values)

    @http.route(['/grades-subjects/topic/detail'], type='json', auth="public", methods=['POST'], website=True)
    def topic_detail(self, **kw):
        slide = []
        breadcrumbs = []
        breadcrumbs.append('Grade')
        if(kw.get('slide_id')):
            slide = request.env['slide.slide'].sudo().search([
                ('id', '=', kw.get('slide_id'))])
            if slide:
                breadcrumbs.append(slide.channel_id.product_categ_id.name)
                breadcrumbs.append(slide.channel_id.name)
                breadcrumbs.append(slide.name)
        values = {'slide': slide,
                  'breadcrumbs': breadcrumbs
                  }
        return request.env['ir.ui.view'].render_template("skit_slide.topic_slide_detail_view", values)

    @http.route(['/grades-subjects/topic/quiz'], type='json', auth="public", methods=['POST'], website=True)
    def next_question(self, **kw):
        slide_question = []
        no = int(kw.get('question_no'))
        if(kw.get('slide_id')):
            slide = request.env['slide.slide'].sudo().search([
                ('id', '=', kw.get('slide_id'))])
            ques = len(slide.quiz_question_ids)
            question_no = int(kw.get('question_no'))
            current_ques = question_no - 1
            slide_question = slide.quiz_question_ids[current_ques]
        values = {'quiz_question': slide_question,
                  'question_no': no
                  }
        return request.env['ir.ui.view'].render_template("skit_slide.document_question", values)
