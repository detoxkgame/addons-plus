# -*- coding: utf-8 -*-


from odoo import http
from odoo.http import request


class WebsiteController(http.Controller):

    @http.route(['/website/software/implementation'], type='json', auth="public", methods=['POST'], website=True)
    def software_imp(self, **post):
        """ Software Implementation"""
        partner = request.env['res.partner'].sudo().create({'name': post['name']})
        new_crm = request.env['crm.lead'].sudo().create({
                                            'name': post['project']+str(' (Software Implementation)'),
                                            'description': post['company'],
                                            'partner_id': partner.id,
                                            'email_from': post['email'],
                                            'phone': post['phone']
                                            })
        return new_crm

    @http.route(['/website/hire/resource'], type='json', auth="public", methods=['POST'], website=True)
    def hire_resource(self, **post):
        """ Hire Resource"""
        partner = request.env['res.partner'].sudo().create({'name': post['name']})
        new_crm = request.env['crm.lead'].sudo().create({
                                            'name': post['project']+str(' (Hire Resource)'),
                                            'description': post['company'],
                                            'partner_id': partner.id,
                                            'email_from': post['email'],
                                            'phone': post['phone']
                                            })
        return new_crm

    @http.route(['/website/software/development'], type='json', auth="public", methods=['POST'], website=True)
    def software_develop(self, **post):
        """ Software Development Needs """
        partner = request.env['res.partner'].sudo().create({'name': post['name']})
        new_crm = request.env['crm.lead'].sudo().create({
                                            'name': post['project']+str(' (Software Devolepment Needs)'),
                                            'description': post['company'],
                                            'partner_id': partner.id,
                                            'email_from': post['email'],
                                            'phone': post['phone']
                                            })
        return new_crm
