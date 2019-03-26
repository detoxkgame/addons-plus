#from odoo import http
#from odoo.http import request


#class Skit_Website_page(http.Controller):

#    @http.route(['/about_us'], type='http',
#                    auth='public', website=True)
#    def about_us_mtd(self, **kw):
#        print ("eaccdsfd dfgdfgd")

# -*- coding: utf-8 -*-


from odoo import http
from odoo.http import request


class WebsiteCareer(http.Controller):

    @http.route(['/website/career/information'], type='json', auth="public", methods=['POST'], website=True)
    def website_career(self, **post):
        """ Career Information"""
        print (post)
        partner = request.env['res.partner'].sudo().create({'name': post['name']})
        new_career = request.env['hr.applicant'].sudo().create({
                                            'name': post['name'],
#                                            'email_from': post['email'],
#                                            'partner_phone': post['phone'],
#                                            'type_id': post['degree'],
                                            'partner_id': partner.id
                                            })
        return new_career