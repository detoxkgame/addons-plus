# -*- coding: utf-8 -*-
# Copyright 2012 - Now Savoir-faire Linux <https://www.savoirfairelinux.com/>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Room Status",
    "version": "12.0.1.1.0",
    "author": "Srikesh Infotech",
    "website": "http://www.srikeshinfotech.com",
    "license": "AGPL-3",
    "category": "Report",
    "depends": [
        'base_external_dbsource','product','skit_hotel_management'
    ],
    "qweb": ['static/src/xml/pos.xml'],
    "data": [
        'security/ir.model.access.csv',
        'views/room_status_templates.xml',
        'views/room_status.xml',
    ],
    'installable': True,
    'application': True,
}
