# -*- coding: utf-8 -*-

{
    'name': 'Slide',
    'summary': "Slide customization",
    'category': 'Website',
    'author': 'Srikesh Infotech',
    'company': 'Srikesh Infotech',
    'website': 'http://www.srikeshinfotech.com',
    'license': "AGPL-3",
    'data': [
        'security/ir.model.access.csv',
        'views/slide_document.xml',
        'views/skit_quiz.xml',
        'views/slide_options.xml',
        'views/website_slides_views.xml',
        'views/skit_website_templates.xml',
        'views/res_partner_views.xml',
        'views/sponser.xml',
    ],
    'depends': ['website_slides', 'website_forum', 'rating', 'sale','base'],
    'installable': True,
    'application': True,
    'auto_install': False,
}