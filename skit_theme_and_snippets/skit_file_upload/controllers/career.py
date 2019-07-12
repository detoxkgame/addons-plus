from odoo import http
from odoo.http import request
import base64

class WebsiteCareer(http.Controller):

    @http.route(['/careers_new'], type='http',
                    auth='public', website=True)
    def careers_new(self, **kw):
        return request.render('skit_file_upload.careers_new')

    @http.route(['/websites/contact_us'], type='json', auth="public", methods=['POST'], website=True)
    def software_imp(self, **post):
        """ Contact Form Details """
        partner = request.env['res.partner'].sudo().create({'name': post['sks_contact_name']})
        new_crm = request.env['crm.lead'].sudo().create({
                                            'name': post['sks_contact_project']+str(' (Contact Form)'),
                                            'description': post['sks_contact_company'],
                                            'partner_id': partner.id,
                                            'email_from': post['sks_contact_email'],
                                            'phone': post['sks_contact_phone']
                                            })
        return new_crm
    
    @http.route(['/websites/career/information'], csrf=False, method=['POST', 'GET'],
                auth="public", website=True)
    def website_career(self, **post):
        """ Create New application """

        data = post.get('doxFile')
        data = data.split(",")
        data = data[1]
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
            bin_data = base64.b64decode(data) if data else b''
            sam = request.env['ir.attachment'].new({'name': file_name,
                                                    'res_model': 'hr.applicant',
                                                    'res_id': new_application.id,
                                                    'db_datas': data,
                                                    'datas_fname': file_name,
                                                    'type': 'binary',
                                                    # 'file_size': file_size,
                                                    'mimetype': file_type,
                                                    'file_size': len(bin_data),
                                                    'checksum': request.env['ir.attachment']._compute_checksum(bin_data),
                                                    'index_content': request.env['ir.attachment']._index(bin_data, file_name, file_type)
                                                })
            samo = sam._convert_to_write({name: sam[name] for name in sam._cache})
            new_attachment = request.env['ir.attachment'].sudo().create(samo)
        return []