# -*- coding: utf-8 -*-

{
    'name': 'Website for Fish Market',
    'summary': "Srikesh Infotech Website Design",
    'category': 'Website',
    'author': 'Srikesh Infotech',
    'company': 'Srikesh Infotech',
    'website': 'http://www.srikeshinfotech.com',
    'depends': [
                'website', 'portal', 'sale'
                ],
    'data': [
        'views/assets.xml',
        'views/sale_portal_templates.xml',
       ],
    #'qweb': ['src/xml/demo_template.xml'],
    #'images': ['static/description/logo.png'],
    'license': "AGPL-3",
    'installable': True,
    'application': True,
    'auto_install': False,
}
