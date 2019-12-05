# -*- coding: utf-8 -*-
{
    'name': "Skit Soil Drilling",

    'summary': """
        Soil Drilling
        """,

    'description': """
       Soil Drilling
    """,

    'author': "Srikesh Infotech",
    'website': "http://www.srikeshinfotech.com",
    'category': 'Project',
    'version': '0.1',
    'depends': ['product','sale','base','project'],
    'data': [
        'views/product.xml',
        'views/sale.xml',
        'views/ir_sequence.xml',
        "security/ir.model.access.csv",
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}