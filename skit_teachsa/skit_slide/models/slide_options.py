# -*- coding: utf-8 -*-
from odoo import models, fields


class SlideChannel(models.Model):

    _inherit = 'slide.channel'

    channel_type = fields.Selection([('D','Documentation'),
                                    ('T','Training')],
                                     string='Type')
    user_id = fields.Many2one('res.users', string='Responsible', index=True)

    website_id = fields.Many2one('website',string='Website')

    enroll = fields.Selection([('public','Public'),
                               ('invite','On Invitation'),
                               ('payment','On Payment')],
                                string='Enroll Policy')
    product_id = fields.Many2one('product.product', string='Product')
    enroll_msg = fields.Html(string='Enroll Message')

    upload_group_ids = fields.Many2many(
        'res.groups', 'rel_upload_groups', 'channel_id', 'group_id',
        string='Upload Groups', help="Groups allowed to upload presentations in this channel. If void, every user can upload.")

    enroll_group_ids = fields.Many2many(
        'res.groups', 'rel_enroll_groups', 'channel_id', 'group_id',
        string='Enroll Groups', help="Groups allowed to upload presentations in this channel. If void, every user can upload.")      
    allow_comment = fields.Boolean(string='Allow Rating')

    forum_id = fields.Many2one('forum.forum',string='Forum')

    publish_template_id = fields.Many2one(
        'mail.template', string='New Content Email',
        help="Email template to send slide publication through email",
        default=lambda self: self.env['ir.model.data'].xmlid_to_res_id('website_slides.slide_template_published'))

    share_template_id = fields.Many2one(
        'mail.template', string='Share Template',
        help="Email template used when sharing a slide",
        default=lambda self: self.env['ir.model.data'].xmlid_to_res_id('website_slides.slide_template_shared')) 
    visibility = fields.Selection([('public', 'Public'),
                                   ('Members Only', 'Members Only')],
                                   string ='Visibility')
    promote_strategy = fields.Selection([('latest', 'Latest Published'),
                                         ('most_voted', 'Most Voted'),
                                         ('most_viewed', 'Most Viewed')],
                                         string='Featuring Policy')


class Slide(models.Model):

    _inherit = 'slide.slide'
    
    display_type = fields.Selection([
        ('line_section', "Section"),
        ('line_note', "Note")], default=False, help="Technical field for UX purpose.")
    
