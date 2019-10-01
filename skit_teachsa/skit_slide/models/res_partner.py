# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.tools.translate import html_translate

class Partner(models.Model):
    _inherit = "res.partner"

    issponsor = fields.Boolean(string='IsSponsor', default=False)
    istutor = fields.Boolean(string='IsTutor', default=False)
    testimonial = fields.Html('Description', translate=html_translate, sanitize_attributes=False)
    website_publish = fields.Boolean( default=False)
    website_published_state = fields.Selection([('published','Published'),
                               ('unpublished','Un Published')],
                                string='Published state',default='unpublished')

    @api.multi
    def publish_button(self):
            
        if self.website_publish==True:
            return self.write({'website_publish': False})
        else:
            return self.write({'website_publish': True})
        
    @api.multi
    def base_website_publish_button(self):
        """ Publish the event for website user
            @param self:base
        """        
        if self.website_published:
            return self.write({'website_published': not self.website_published,
                               'website_published_state': 'unpublished'
                               })
        else:
            return self.write({'website_published': True,
                               'website_published_state': 'published'
                               })
