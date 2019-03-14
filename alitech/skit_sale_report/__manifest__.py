# -*- coding: utf-8 -*-

{
    'name': 'Skit Sale Report',
    'category': 'Sales',
    'summary': 'Sales Analysis Report',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'description': """
        Sales Analysis Report.
==========================

""",
    'depends': ['sale'],
    'data': [
        'report/sale_report_templates.xml',
        'report/sale_report.xml',
        'views/report_templates.xml',
        'views/sale_order_views.xml',
        'views/res_partner_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
