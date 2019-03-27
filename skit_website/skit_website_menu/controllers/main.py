
from odoo import http
from odoo.http import request


class Website(http.Controller):

    @http.route(['/websites/career/information'], csrf=False, method=['POST', 'GET'],
                auth="public", website=True)
    def website_career(self, **post):
        """ Create New application """

        data = post.get('doxFile')
        file_name = post.get('file_name')
        file_size = post.get('size')
        file_type = post.get('file_type')
        description = ""
        if post.get('degree'):
            description = post.get('degree')+" \n"
        description = description+post.get('about')
        new_application = request.env['hr.applicant'].sudo().create({
                                            'name': post['name'],
                                            'email_from': post['email'],
                                            'partner_phone': post['phone'],
                                            'partner_mobile': post['phone'],
                                            'description': description,
                                            'partner_name': post['name']
                                            })
        if new_application:
            sam = request.env['ir.attachment'].new({'name': file_name,
                                                    'res_model': 'hr.applicant',
                                                    'res_id': new_application.id,
                                                    'db_datas': data,
                                                    'datas_fname': file_name,
                                                    'type': 'binary',
                                                    'file_size': file_size,
                                                    'mimetype': file_type
                                                })
            samo = sam._convert_to_write({name: sam[name] for name in sam._cache})
            new_attachment = request.env['ir.attachment'].sudo().create(samo)
        return True