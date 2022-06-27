exports.list_to_tree = (list) => {
    var map = {},
        node,
        roots = [],
        i;

    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i]["children"] = []; // initialize the children
    }

    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parent_category_id) {
            // if you have dangling branches check that map[node.parentId] exists
            if (map[node.parent_category_id] !== undefined) {
                list[map[node.parent_category_id]].children.push(node);
            }
        } else {
            roots.push(node);
        }
    }
    return roots;
};

exports.jwtSecretKey = () => {
    return 'PikyTopSecret'
}