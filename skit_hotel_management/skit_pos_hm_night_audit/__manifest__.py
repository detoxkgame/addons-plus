# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'POS Hotel Management Night Audit',
    'version': '1.1',
    'author': 'Srikesh Infotech',
    'license': "AGPL-3",
    'website': 'http://www.srikeshinfotech.com',
    'sequence': 15,
    'summary': 'Night audit',
    'description': """
Night Audit
==================================================================
This module allows you to easily manage room availability.
""",
    'images': ['images/main_screenshot.png'],
    'price': 30,
    'currency': 'EUR',
    'category': 'Point of sales',
    'depends': ['sale', 'purchase', 'point_of_sale'],
    'data': ['views/pos_session_templates.xml',
             'views/pos_session_action.xml',
             'views/night_audit_view.xml',
             'report/report_pos_statement.xml',
             'security/ir.model.access.csv',
             ],
    'qweb': ['static/src/xml/pos_session.xml'],

    'installable': True,
    'auto_install': False,
    'application': True,
}
