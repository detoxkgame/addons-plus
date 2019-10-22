# -*- coding: utf-8 -*-

{
    'name': 'Website for Wet Market',
    'summary': "Srikesh Infotech Website Design",
    'category': 'Website',
    'author': 'Srikesh Infotech',
    'company': 'Srikesh Infotech',
    'website': 'http://www.srikeshinfotech.com',
    'depends': [
                'website', 'portal', 'sale', 'web', 'website_sale', 'skit_website_popup'
                ],
    'data': [
        'data/wet_auth_signup_data.xml',
        'views/assets.xml',
        'views/sale_portal_templates.xml',
        'views/auth_login_templates.xml',
        'views/skit_mobile_view.xml',
        'views/product_template_view.xml'
       ],
    'license': "AGPL-3",
    'installable': True,
    'application': True,
    'auto_install': False,
}
