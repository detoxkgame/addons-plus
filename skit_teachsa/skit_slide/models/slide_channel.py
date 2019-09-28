# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class Rating(models.Model):
    _inherit = "rating.rating"

    channel_id = fields.Many2one('slide.channel', string='Channel')


class SlideChannelPartner(models.Model):
    _name = "slide.channel.partner"
    _description = "Slide Channel Partner"

    partner_id = fields.Many2one('res.partner', string='Contact',
                                 required=True)
    partner_email = fields.Char(string='Email')
    channel_id = fields.Many2one('slide.channel', string='Channel')
    iscompleted = fields.Boolean(string='Is Completed', default=False)

    @api.onchange('partner_id')
    def _onchange_partner_id(self):
        self.partner_email = self.partner_id.email


class Channel(models.Model):
    _inherit = 'slide.channel'

    channel_partner_ids = fields.One2many('slide.channel.partner',
                                          'channel_id',
                                          string='Channel Partner')
    members_count = fields.Integer(string='Attendees',
                                   compute='_compute_channel_partner_ids')
    members_done_count = fields.Integer(string='Finished',
                                        compute='_compute_channel_partner_ids')
    total_slides = fields.Integer(string='Contents',
                                  compute='_compute_slide_ids')
    rating_ids = fields.One2many('rating.rating', 'channel_id',
                                 string='Rating')
    rating_count = fields.Integer(string='Reviews',
                                  compute='_compute_rating_ids')
    forum_total_posts = fields.Integer(string='Forum Posts',
                                       compute='_compute_forum_id')

    @api.depends('channel_partner_ids')
    def _compute_channel_partner_ids(self):
        for channel in self:
            channel.members_count = len(channel.channel_partner_ids)
            finish_channel = self.env['slide.channel.partner'].sudo().search([
                ('id', 'in', channel.channel_partner_ids.ids),
                ('iscompleted', '=', True)])
            channel.members_done_count = len(finish_channel)

    @api.depends('slide_ids')
    def _compute_slide_ids(self):
        for channel in self:
            channel.total_slides = len(channel.slide_ids)

    @api.depends('rating_ids')
    def _compute_rating_ids(self):
        for channel in self:
            channel.rating_count = len(channel.rating_ids)

    @api.depends('forum_id')
    def _compute_forum_id(self):
        for channel in self:
            forum_post = self.env['forum.post'].sudo().search([
                ('forum_id', '=', channel.forum_id.id)])
            channel.forum_total_posts = len(forum_post)

    @api.multi
    def action_redirect_to_members(self):
        action = self.env.ref('skit_slide.action_slide_channel_partner_tree_all').read()[0]
        return action

    @api.multi
    def action_redirect_to_done_members(self):
        action = self.env.ref('skit_slide.action_slide_channel_partner_tree_all').read()[0]
        action['domain'] = [('iscompleted', '=', True)]
        return action

    @api.multi
    def action_view_slides(self):
        action = self.env.ref('website_slides.action_slides_slides').read()[0]
        slides = self.mapped('slide_ids')
        action['domain'] = [('id', 'in', slides.ids)]
        return action

    @api.multi
    def action_view_ratings(self):
        action = self.env.ref('rating.action_view_rating').read()[0]
        ratings = self.mapped('rating_ids')
        action['domain'] = [('id', 'in', ratings.ids)]
        return action

    @api.multi
    def action_redirect_to_forum(self):
        action = self.env.ref('website_forum.action_forum_post').read()[0]
        action['domain'] = [('forum_id', '=', self.forum_id.id)]
        return action
